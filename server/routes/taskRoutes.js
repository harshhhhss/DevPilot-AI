const express = require('express');
const { listTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const commentRoutes = require('./commentRoutes');

const router = express.Router({ mergeParams: true });

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
