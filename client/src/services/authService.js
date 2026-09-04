import api from './api';

const register = (payload) => api.post('/auth/register', payload).then((r) => r.data.data);
const login = (payload) => api.post('/auth/login', payload).then((r) => r.data.data);
const getMe = () => api.get('/auth/me').then((r) => r.data.data);
const updateProfile = (payload) => api.put('/auth/profile', payload).then((r) => r.data.data);
const changePassword = (payload) => api.put('/auth/change-password', payload).then((r) => r.data);

export default { register, login, getMe, updateProfile, changePassword };
