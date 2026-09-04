import api from './api';

const getOverview = () => api.get('/analytics/overview').then((r) => r.data.data);
const getProjectAnalytics = (projectId) => api.get(`/projects/${projectId}/analytics`).then((r) => r.data.data);

export default { getOverview, getProjectAnalytics };
