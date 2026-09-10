import api from './api';

const generateSprintPlan = (payload) => api.post('/ai/sprint-plan', payload).then((r) => r.data);
const generateUserStory = (payload) => api.post('/ai/user-story', payload).then((r) => r.data);
const prioritizeTask = (payload) => api.post('/ai/prioritize-task', payload).then((r) => r.data);
const analyzeBug = (payload) => api.post('/ai/analyze-bug', payload).then((r) => r.data);
const analyzeRisk = (payload) => api.post('/ai/analyze-risk', payload).then((r) => r.data);
const summarizeMeeting = (payload) => api.post('/ai/summarize-meeting', payload).then((r) => r.data);
const parseTask = (payload) => api.post('/ai/parse-task', payload).then((r) => r.data);
const generateSprintRetro = (sprintId) => api.post(`/ai/sprint-retro/${sprintId}`).then((r) => r.data);

export default {
  generateSprintPlan,
  generateUserStory,
  prioritizeTask,
  analyzeBug,
  analyzeRisk,
  summarizeMeeting,
  parseTask,
  generateSprintRetro,
};
