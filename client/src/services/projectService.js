import api from './api';

const list = (params) => api.get('/projects', { params }).then((r) => r.data.data);
const get = (id) => api.get(`/projects/${id}`).then((r) => r.data.data);
const create = (payload) => api.post('/projects', payload).then((r) => r.data.data);
const update = (id, payload) => api.put(`/projects/${id}`, payload).then((r) => r.data.data);
const archive = (id) => api.put(`/projects/${id}/archive`).then((r) => r.data.data);
const remove = (id) => api.delete(`/projects/${id}`).then((r) => r.data);
const addMember = (id, userId) => api.post(`/projects/${id}/members`, { userId }).then((r) => r.data.data);
const removeMember = (id, userId) => api.delete(`/projects/${id}/members/${userId}`).then((r) => r.data.data);

export default { list, get, create, update, archive, remove, addMember, removeMember };
