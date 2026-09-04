const express = require('express');
const { listTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const commentRoutes = require('./commentRoutes');

const router = express.Router({ mergeParams: true });

// Applied here (not just by the parent project router) because this router is
// also mounted flat at /api/v1/tasks for a user's cross-project task list.
router.use(protect);

router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

router.use('/:id/comments', (req, res, next) => {
  req.commentEntityType = 'Task';
  next();
}, commentRoutes);

module.exports = router;
