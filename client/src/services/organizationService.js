import api from './api';

const list = () => api.get('/organizations').then((r) => r.data.data);

export default { list };
