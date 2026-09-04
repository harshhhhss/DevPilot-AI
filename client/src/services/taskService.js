import api from './api';

const list = (params) => api.get('/tasks', { params }).then((r) => r.data.data);
const listForProject = (projectId, params) =>
  api.get(`/projects/${projectId}/tasks`, { params }).then((r) => r.data.data);
const get = (id) => api.get(`/tasks/${id}`).then((r) => r.data.data);
const create = (projectId, payload) => api.post(`/projects/${projectId}/tasks`, payload).then((r) => r.data.data);
const update = (id, payload) => api.put(`/tasks/${id}`, payload).then((r) => r.data.data);
const remove = (id) => api.delete(`/tasks/${id}`).then((r) => r.data);

const listComments = (taskId) => api.get(`/tasks/${taskId}/comments`).then((r) => r.data.data);
const addComment = (taskId, content) => api.post(`/tasks/${taskId}/comments`, { content }).then((r) => r.data.data);

export default { list, listForProject, get, create, update, remove, listComments, addComment };
