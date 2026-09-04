const express = require('express');
const { listBugs, getBug, createBug, updateBug, deleteBug } = require('../controllers/bugController');
const commentRoutes = require('./commentRoutes');

const router = express.Router({ mergeParams: true });

router.get('/', listBugs);
router.post('/', createBug);
router.get('/:id', getBug);
router.put('/:id', updateBug);
router.delete('/:id', deleteBug);

router.use('/:id/comments', (req, res, next) => {
  req.commentEntityType = 'Bug';
  next();
}, commentRoutes);

module.exports = router;
