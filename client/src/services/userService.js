import api from './api';

const list = (params) => api.get('/users', { params }).then((r) => r.data.data);
const get = (id) => api.get(`/users/${id}`).then((r) => r.data.data);
const updateRole = (id, role) => api.put(`/users/${id}/role`, { role }).then((r) => r.data.data);
const updateStatus = (id, isActive) => api.put(`/users/${id}/status`, { isActive }).then((r) => r.data.data);
const remove = (id) => api.delete(`/users/${id}`).then((r) => r.data);

export default { list, get, updateRole, updateStatus, remove };
