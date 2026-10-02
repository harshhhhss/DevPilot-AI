const { GoogleGenerativeAI } = require('@google/generative-ai');
const ApiError = require('../utils/ApiError');

let client = null;

const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // CON-04: if the AI provider is unavailable/unconfigured, callers must
    // degrade to manual entry rather than fail silently or fake a response.
    throw new ApiError(503, 'AI provider is not configured. Please use manual entry.');
  }

  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }

  return client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
};

/**
 * Sends a prompt to Gemini and parses the JSON response. Throws a 503
 * ApiError (never a fake/fallback payload) if the provider fails or returns
 * something that cannot be parsed as JSON.
 */
const callGemini = async (systemInstruction, userPrompt) => {
  const model = getModel();

  let result;
  try {
    result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
    });
  } catch (error) {
    throw new ApiError(503, `AI provider request failed: ${error.message}`);
  }

  const text = result?.response?.text();

  if (!text) {
    throw new ApiError(502, 'AI provider returned an empty response');
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiError(502, 'AI provider returned an unparseable response');
  }
};

/*
 * callGemini only guarantees the response was valid JSON — it says nothing
 * about whether that JSON actually matches the shape a feature promised the
 * caller. Gemini can (and occasionally does) omit a field, return a string
 * where an array was expected, or use a priority value outside the declared
 * enum. Every feature below runs its parsed result through one of these
 * small, hand-rolled checks before returning it: enums get normalized (case
 * folded, defaulted if invalid) rather than hard-failing on a near-miss, but
 * a genuinely missing required field still throws a 502 ApiError — the same
 * "never fabricate, never pass through garbage" rule CON-04 already applies
 * to transport-level failures now also applies to shape-level ones.
 */
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const shapeError = (where) => new ApiError(502, `AI provider returned a response that did not match the expected shape (${where})`);

const asString = (value, fallback = '') => (typeof value === 'string' ? value.trim() : fallback);
const asNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const asStringArray = (value) =>
  Array.isArray(value) ? value.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim()) : [];
const normalizeEnum = (value, allowed, fallback) => {
  const upper = asString(value).toUpperCase();
  return allowed.includes(upper) ? upper : fallback;
};
const requireString = (value, where) => {
  const s = asString(value);
  if (!s) throw shapeError(where);
  return s;
};

const SPRINT_PLAN_INSTRUCTION = `You are an expert Agile delivery lead assisting a Project Manager with sprint planning inside DevPilot AI.
Given a natural-language sprint goal and project context, produce a structured, actionable backlog.
Respond ONLY with JSON matching exactly this shape:
{
  "sprintSummary": string,              // one or two sentences
  "stories": [
    {
      "title": string,                  // 3-8 words
      "userStory": string,              // "As a ... I want ... so that ..."
      "acceptanceCriteria": string[],   // 2-5 concrete, testable criteria
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "storyPoints": number,            // a realistic estimate: 1, 2, 3, 5, 8, or 13
      "tasks": [
        { "title": string, "description": string, "estimatedHours": number }
      ]
    }
  ]
}
Generate between 3 and 7 stories, scoped tightly to what the goal actually describes rather than padded with unrelated work. Give every story at least one task. Do not include any text outside the JSON object.`;

const generateSprintPlan = async ({ sprintGoal, projectName, projectDescription, teamSize }) => {
  const userPrompt = `Project: ${projectName}
Project description: ${projectDescription || 'N/A'}
Team size: ${teamSize || 'unspecified'}
Sprint goal (natural language, from the Project Manager): """${sprintGoal}"""

Generate the structured sprint backlog as specified.`;

  const result = await callGemini(SPRINT_PLAN_INSTRUCTION, userPrompt);

  const stories = (Array.isArray(result?.stories) ? result.stories : []).map((s, i) => ({
    title: requireString(s?.title, `sprint plan: stories[${i}].title`),
    userStory: requireString(s?.userStory, `sprint plan: stories[${i}].userStory`),
    acceptanceCriteria: asStringArray(s?.acceptanceCriteria),
    priority: normalizeEnum(s?.priority, PRIORITIES, 'MEDIUM'),
    storyPoints: asNumber(s?.storyPoints, 3),
    tasks: (Array.isArray(s?.tasks) ? s.tasks : [])
      .map((t) => ({
        title: asString(t?.title),
        description: asString(t?.description),
        estimatedHours: asNumber(t?.estimatedHours, 0),
      }))
      .filter((t) => t.title),
  }));

  if (stories.length === 0) throw shapeError('sprint plan: no usable stories returned');

  return { sprintSummary: requireString(result?.sprintSummary, 'sprint plan: sprintSummary'), stories };
};

const USER_STORY_INSTRUCTION = `You are an expert product analyst helping write a single well-formed user story for DevPilot AI.
Respond ONLY with JSON matching exactly this shape:
{
  "userStory": string,                  // "As a ... I want ... so that ..."
  "acceptanceCriteria": string[],       // 2-5 concrete, testable criteria
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "suggestedTasks": [
    { "title": string, "description": string }
  ]                                      // 0-4 tasks; empty array if the feature is small enough to not need breaking down
}
Do not include any text outside the JSON object.`;

const generateUserStory = async ({ featureDescription, projectName }) => {
  const userPrompt = `Project: ${projectName || 'N/A'}
Feature description: """${featureDescription}"""

Generate the user story as specified.`;

  const result = await callGemini(USER_STORY_INSTRUCTION, userPrompt);

  return {
    userStory: requireString(result?.userStory, 'user story: userStory'),
    acceptanceCriteria: asStringArray(result?.acceptanceCriteria),
    suggestedPriority: normalizeEnum(result?.suggestedPriority, PRIORITIES, 'MEDIUM'),
    suggestedTasks: (Array.isArray(result?.suggestedTasks) ? result.suggestedTasks : [])
      .map((t) => ({ title: asString(t?.title), description: asString(t?.description) }))
      .filter((t) => t.title),
  };
};

const PRIORITIZATION_INSTRUCTION = `You are an assistant that recommends task priority for a software project management tool.
Analyze the given task's deadline, dependencies, and project/sprint context.
Respond ONLY with JSON matching exactly this shape:
{
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "reason": string                      // one or two sentences, referencing the specific deadline/dependency data given, not generic advice
}
This is only a recommendation shown to the user — never claim certainty. Do not include any text outside the JSON object.`;

const prioritizeTask = async ({ title, description, dueDate, dependenciesCount, sprintEndDate, currentPriority }) => {
  const userPrompt = `Task title: ${title}
Description: ${description || 'N/A'}
Current priority: ${currentPriority}
Due date: ${dueDate || 'none'}
Number of dependencies blocking this task: ${dependenciesCount}
Sprint end date: ${sprintEndDate || 'N/A'}

Recommend a priority as specified.`;

  const result = await callGemini(PRIORITIZATION_INSTRUCTION, userPrompt);

  return {
    suggestedPriority: normalizeEnum(result?.suggestedPriority, PRIORITIES, 'MEDIUM'),
    reason: requireString(result?.reason, 'task prioritization: reason'),
  };
};

const BUG_ANALYSIS_INSTRUCTION = `You are an experienced software debugging assistant inside DevPilot AI's bug tracker.
Analyze the bug report and produce a diagnostic recommendation. This is advisory only, never a guaranteed diagnosis.
Respond ONLY with JSON matching exactly this shape:
{
  "possibleCause": string,
  "suggestedSeverity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "affectedModule": string,             // your best guess at the module/area, e.g. "checkout", "auth" - "Unknown" if nothing in the report points anywhere specific
  "debuggingSuggestions": string[],     // 2-4 concrete steps grounded in the report, not generic troubleshooting platitudes
  "nextSteps": string[]                 // 2-4 concrete next actions
}
Do not include any text outside the JSON object.`;

const analyzeBug = async ({ title, description, stepsToReproduce, expectedResult, actualResult }) => {
  const userPrompt = `Bug title: ${title}
Description: ${description || 'N/A'}
Steps to reproduce: ${stepsToReproduce || 'N/A'}
Expected result: ${expectedResult || 'N/A'}
Actual result: ${actualResult || 'N/A'}

Produce the diagnostic recommendation as specified.`;

  const result = await callGemini(BUG_ANALYSIS_INSTRUCTION, userPrompt);

  return {
    possibleCause: requireString(result?.possibleCause, 'bug analysis: possibleCause'),
    suggestedSeverity: normalizeEnum(result?.suggestedSeverity, PRIORITIES, 'MEDIUM'),
    affectedModule: asString(result?.affectedModule, 'Unknown'),
    debuggingSuggestions: asStringArray(result?.debuggingSuggestions),
    nextSteps: asStringArray(result?.nextSteps),
  };
};

const RISK_ANALYSIS_INSTRUCTION = `You are a delivery risk analyst for a software project management platform.
Given aggregate project metrics, assess schedule/scope risk.
Respond ONLY with JSON matching exactly this shape:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "explanation": string,                // two to three sentences, referencing the actual metrics given
  "keyFactors": string[]                // 2-4 items, each naming a specific metric from the input, e.g. "3 overdue tasks"
}
Do not include any text outside the JSON object.`;

const analyzeRisk = async (metrics) => {
  const userPrompt = `Project metrics:
${JSON.stringify(metrics, null, 2)}

Assess the project risk as specified.`;

  const result = await callGemini(RISK_ANALYSIS_INSTRUCTION, userPrompt);

  return {
    riskLevel: normalizeEnum(result?.riskLevel, RISK_LEVELS, 'MEDIUM'),
    explanation: requireString(result?.explanation, 'risk analysis: explanation'),
    keyFactors: asStringArray(result?.keyFactors),
  };
};

const MEETING_SUMMARY_INSTRUCTION = `You are a meeting-notes summarizer for a software team inside DevPilot AI.
Given raw meeting notes/transcript, extract a concise structured summary.
Respond ONLY with JSON matching exactly this shape:
{
  "summary": string,                    // two to four sentences
  "keyDecisions": string[],             // 0-5 items; empty array if none were made
  "actionItems": [
    { "description": string, "assigneeName": string, "deadline": string | null }
  ],                                     // each description should be a concrete, assignable task, not a vague note
  "discussionPoints": string[]
}
Use an empty string for assigneeName and null for deadline when not mentioned. Do not invent action items that were not actually discussed. Do not include any text outside the JSON object.`;

const summarizeMeeting = async ({ notes, projectName }) => {
  const userPrompt = `Project: ${projectName || 'N/A'}
Meeting notes:
"""
${notes}
"""

Summarize as specified.`;

  const result = await callGemini(MEETING_SUMMARY_INSTRUCTION, userPrompt);

  return {
    summary: requireString(result?.summary, 'meeting summary: summary'),
    keyDecisions: asStringArray(result?.keyDecisions),
    actionItems: (Array.isArray(result?.actionItems) ? result.actionItems : [])
      .map((item) => ({
        description: asString(item?.description),
        assigneeName: asString(item?.assigneeName),
        deadline: typeof item?.deadline === 'string' && item.deadline.trim() ? item.deadline.trim() : null,
      }))
      .filter((item) => item.description),
    discussionPoints: asStringArray(result?.discussionPoints),
  };
};

const TASK_PARSE_INSTRUCTION = `You are an assistant that converts a single natural-language request into a structured task draft for DevPilot AI's Kanban board.
Respond ONLY with JSON matching exactly this shape:
{
  "title": string,                      // concise, 3-8 words
  "description": string,                // one or two sentences expanding on the title - do not just repeat the title verbatim
  "dueDate": string | null,             // ISO date "YYYY-MM-DD", resolved from any relative date mentioned (e.g. "next Friday") against today's date, or null if none was mentioned
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "suggestedAssigneeName": string | null   // the person/team/module name mentioned as the assignee, verbatim, or null if none was mentioned
}
Default to "MEDIUM" priority when none is stated. Do not include any text outside the JSON object.`;

const parseTaskFromText = async ({ text, referenceDate, projectName, memberNames }) => {
  const userPrompt = `Today's date: ${referenceDate}
Project: ${projectName || 'N/A'}
Known team members on this project: ${memberNames?.length ? memberNames.join(', ') : 'N/A'}
Request: """${text}"""

Parse this into the structured task draft as specified.`;

  const result = await callGemini(TASK_PARSE_INSTRUCTION, userPrompt);
  const dueDate = typeof result?.dueDate === 'string' && ISO_DATE.test(result.dueDate.trim()) ? result.dueDate.trim() : null;
  const assigneeName = typeof result?.suggestedAssigneeName === 'string' && result.suggestedAssigneeName.trim() ? result.suggestedAssigneeName.trim() : null;

  return {
    title: requireString(result?.title, 'task parse: title'),
    description: asString(result?.description),
    dueDate,
    priority: normalizeEnum(result?.priority, PRIORITIES, 'MEDIUM'),
    suggestedAssigneeName: assigneeName,
  };
};

const SPRINT_RETRO_INSTRUCTION = `You are an Agile coach helping a Project Manager run a sprint retrospective inside DevPilot AI.
Given a summary of what happened during the sprint, produce a balanced, constructive retrospective.
Respond ONLY with JSON matching exactly this shape:
{
  "wentWell": string[],         // 1-4 items grounded in the specific data given
  "didntGoWell": string[],      // 0-4 items grounded in the specific data given; empty array if nothing stands out
  "improvements": string[]      // 2-3 concrete, actionable suggestions for the next sprint
}
Be specific and reference the given data where relevant, but do not invent facts not supported by it. Avoid generic retrospective platitudes that could apply to any sprint. Do not include any text outside the JSON object.`;

const generateSprintRetro = async ({ sprintName, sprintGoal, completedTasks, carriedOverTasks, bugsReported }) => {
  const userPrompt = `Sprint: ${sprintName}
Sprint goal: ${sprintGoal || 'N/A'}

Completed tasks (${completedTasks.length}):
${completedTasks.map((t) => `- ${t.title} [${t.priority}]`).join('\n') || 'None'}

Carried-over / incomplete tasks (${carriedOverTasks.length}):
${carriedOverTasks.map((t) => `- ${t.title} [${t.priority}, ${t.status}]`).join('\n') || 'None'}

Bugs reported during the sprint window (${bugsReported.length}):
${bugsReported.map((b) => `- ${b.title} [${b.severity}, ${b.status}]`).join('\n') || 'None'}

Generate the sprint retrospective as specified.`;

  const result = await callGemini(SPRINT_RETRO_INSTRUCTION, userPrompt);

  return {
    wentWell: asStringArray(result?.wentWell),
    didntGoWell: asStringArray(result?.didntGoWell),
    improvements: asStringArray(result?.improvements),
  };
};

module.exports = {
  generateSprintPlan,
  generateUserStory,
  prioritizeTask,
  analyzeBug,
  analyzeRisk,
  summarizeMeeting,
  parseTaskFromText,
  generateSprintRetro,
};
