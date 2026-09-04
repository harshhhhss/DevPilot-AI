const express = require('express');
const { listBugs, getBug, createBug, updateBug, deleteBug } = require('../controllers/bugController');
const { protect } = require('../middleware/authMiddleware');
const commentRoutes = require('./commentRoutes');

const router = express.Router({ mergeParams: true });

// Applied here (not just by the parent project router) because this router is
// also mounted flat at /api/v1/bugs for a user's cross-project bug list.
router.use(protect);

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
