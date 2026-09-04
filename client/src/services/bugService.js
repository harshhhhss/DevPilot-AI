import api from './api';

const list = (params) => api.get('/bugs', { params }).then((r) => r.data.data);
const listForProject = (projectId, params) =>
  api.get(`/projects/${projectId}/bugs`, { params }).then((r) => r.data.data);
const get = (id) => api.get(`/bugs/${id}`).then((r) => r.data.data);
const create = (projectId, payload) => api.post(`/projects/${projectId}/bugs`, payload).then((r) => r.data.data);
const update = (id, payload) => api.put(`/bugs/${id}`, payload).then((r) => r.data.data);
const remove = (id) => api.delete(`/bugs/${id}`).then((r) => r.data);

const listComments = (bugId) => api.get(`/bugs/${bugId}/comments`).then((r) => r.data.data);
const addComment = (bugId, content) => api.post(`/bugs/${bugId}/comments`, { content }).then((r) => r.data.data);

export default { list, listForProject, get, create, update, remove, listComments, addComment };
