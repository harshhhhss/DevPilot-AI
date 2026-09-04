import api from './api';

const list = (projectId) => api.get(`/projects/${projectId}/meetings`).then((r) => r.data.data);
const get = (projectId, id) => api.get(`/projects/${projectId}/meetings/${id}`).then((r) => r.data.data);
const create = (projectId, payload) => api.post(`/projects/${projectId}/meetings`, payload).then((r) => r.data.data);
const convertActionItem = (projectId, meetingId, itemId) =>
  api.post(`/projects/${projectId}/meetings/${meetingId}/action-items/${itemId}/convert`).then((r) => r.data.data);

export default { list, get, create, convertActionItem };
