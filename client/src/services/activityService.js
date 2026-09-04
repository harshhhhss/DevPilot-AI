import api from './api';

const listForProject = (projectId, limit) =>
  api.get(`/projects/${projectId}/activity`, { params: { limit } }).then((r) => r.data.data);

export default { listForProject };
