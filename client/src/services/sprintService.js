import api from './api';

const list = (projectId) => api.get(`/projects/${projectId}/sprints`).then((r) => r.data.data);
const get = (projectId, id) => api.get(`/projects/${projectId}/sprints/${id}`).then((r) => r.data.data);
const create = (projectId, payload) => api.post(`/projects/${projectId}/sprints`, payload).then((r) => r.data.data);
const update = (projectId, id, payload) =>
  api.put(`/projects/${projectId}/sprints/${id}`, payload).then((r) => r.data.data);
const remove = (projectId, id) => api.delete(`/projects/${projectId}/sprints/${id}`).then((r) => r.data);
const saveRetrospective = (projectId, id, payload) =>
  api.put(`/projects/${projectId}/sprints/${id}/retrospective`, payload).then((r) => r.data.data);

export default { list, get, create, update, remove, saveRetrospective };
