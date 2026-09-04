import api from './api';

const list = (params) => api.get('/notifications', { params }).then((r) => r.data);
const markAsRead = (id) => api.put(`/notifications/${id}/read`).then((r) => r.data.data);
const markAllAsRead = () => api.put('/notifications/read-all').then((r) => r.data);
const remove = (id) => api.delete(`/notifications/${id}`).then((r) => r.data);

export default { list, markAsRead, markAllAsRead, remove };
