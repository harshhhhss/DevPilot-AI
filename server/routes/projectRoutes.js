const express = require('express');
const {
  listProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { MANAGING_ROLES } = require('../utils/roles');

const sprintRoutes = require('./sprintRoutes');
const taskRoutes = require('./taskRoutes');
const bugRoutes = require('./bugRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const meetingRoutes = require('./meetingRoutes');

const router = express.Router();

router.use(protect);

router.get('/', listProjects);
router.post('/', authorize(...MANAGING_ROLES), createProject);
router.get('/:id', getProject);
router.put('/:id', authorize(...MANAGING_ROLES), updateProject);
router.put('/:id/archive', authorize(...MANAGING_ROLES), archiveProject);
router.delete('/:id', authorize(...MANAGING_ROLES), deleteProject);
router.post('/:id/members', authorize(...MANAGING_ROLES), addMember);
router.delete('/:id/members/:userId', authorize(...MANAGING_ROLES), removeMember);

// Nested project-scoped resources.
router.use('/:projectId/sprints', sprintRoutes);
router.use('/:projectId/tasks', taskRoutes);
router.use('/:projectId/bugs', bugRoutes);
router.use('/:projectId/analytics', analyticsRoutes);
router.use('/:projectId/meetings', meetingRoutes);

module.exports = router;
