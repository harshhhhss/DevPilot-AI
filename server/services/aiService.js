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

const SPRINT_PLAN_INSTRUCTION = `You are an expert Agile delivery lead assisting a Project Manager with sprint planning inside DevPilot AI.
Given a natural-language sprint goal and project context, produce a structured, actionable backlog.
Respond ONLY with JSON matching exactly this shape:
{
  "sprintSummary": string,
  "stories": [
    {
      "title": string,
      "userStory": string,               // "As a ... I want ... so that ..."
      "acceptanceCriteria": string[],
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "storyPoints": number,
      "tasks": [
        { "title": string, "description": string, "estimatedHours": number }
      ]
    }
  ]
}
Keep stories focused and realistic for a single sprint. Do not include any text outside the JSON object.`;

const generateSprintPlan = async ({ sprintGoal, projectName, projectDescription, teamSize }) => {
  const userPrompt = `Project: ${projectName}
Project description: ${projectDescription || 'N/A'}
Team size: ${teamSize || 'unspecified'}
Sprint goal (natural language, from the Project Manager): """${sprintGoal}"""

Generate the structured sprint backlog as specified.`;

  return callGemini(SPRINT_PLAN_INSTRUCTION, userPrompt);
};

const USER_STORY_INSTRUCTION = `You are an expert product analyst helping write a single well-formed user story for DevPilot AI.
Respond ONLY with JSON matching exactly this shape:
{
  "userStory": string,                 // "As a ... I want ... so that ..."
  "acceptanceCriteria": string[],
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "suggestedTasks": [
    { "title": string, "description": string }
  ]
}
Do not include any text outside the JSON object.`;

const generateUserStory = async ({ featureDescription, projectName }) => {
  const userPrompt = `Project: ${projectName || 'N/A'}
Feature description: """${featureDescription}"""

Generate the user story as specified.`;

  return callGemini(USER_STORY_INSTRUCTION, userPrompt);
};

const PRIORITIZATION_INSTRUCTION = `You are an assistant that recommends task priority for a software project management tool.
Analyze the given task's deadline, dependencies, and project/sprint context.
Respond ONLY with JSON matching exactly this shape:
{
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "reason": string
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

  return callGemini(PRIORITIZATION_INSTRUCTION, userPrompt);
};

const BUG_ANALYSIS_INSTRUCTION = `You are an experienced software debugging assistant inside DevPilot AI's bug tracker.
Analyze the bug report and produce a diagnostic recommendation. This is advisory only, never a guaranteed diagnosis.
Respond ONLY with JSON matching exactly this shape:
{
  "possibleCause": string,
  "suggestedSeverity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "affectedModule": string,
  "debuggingSuggestions": string[],
  "nextSteps": string[]
}
Do not include any text outside the JSON object.`;

const analyzeBug = async ({ title, description, stepsToReproduce, expectedResult, actualResult }) => {
  const userPrompt = `Bug title: ${title}
Description: ${description || 'N/A'}
Steps to reproduce: ${stepsToReproduce || 'N/A'}
Expected result: ${expectedResult || 'N/A'}
Actual result: ${actualResult || 'N/A'}

Produce the diagnostic recommendation as specified.`;

  return callGemini(BUG_ANALYSIS_INSTRUCTION, userPrompt);
};

const RISK_ANALYSIS_INSTRUCTION = `You are a delivery risk analyst for a software project management platform.
Given aggregate project metrics, assess schedule/scope risk.
Respond ONLY with JSON matching exactly this shape:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "explanation": string,
  "keyFactors": string[]
}
Do not include any text outside the JSON object.`;

const analyzeRisk = async (metrics) => {
  const userPrompt = `Project metrics:
${JSON.stringify(metrics, null, 2)}

Assess the project risk as specified.`;

  return callGemini(RISK_ANALYSIS_INSTRUCTION, userPrompt);
};

const MEETING_SUMMARY_INSTRUCTION = `You are a meeting-notes summarizer for a software team inside DevPilot AI.
Given raw meeting notes/transcript, extract a concise structured summary.
Respond ONLY with JSON matching exactly this shape:
{
  "summary": string,
  "keyDecisions": string[],
  "actionItems": [
    { "description": string, "assigneeName": string, "deadline": string | null }
  ],
  "discussionPoints": string[]
}
Use an empty string for assigneeName and null for deadline when not mentioned. Do not include any text outside the JSON object.`;

const summarizeMeeting = async ({ notes, projectName }) => {
  const userPrompt = `Project: ${projectName || 'N/A'}
Meeting notes:
"""
${notes}
"""

Summarize as specified.`;

  return callGemini(MEETING_SUMMARY_INSTRUCTION, userPrompt);
};

module.exports = {
  generateSprintPlan,
  generateUserStory,
  prioritizeTask,
  analyzeBug,
  analyzeRisk,
  summarizeMeeting,
};
