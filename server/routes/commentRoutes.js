const express = require('express');
const { listComments, createComment, deleteComment } = require('../controllers/commentController');

const router = express.Router({ mergeParams: true });

router.get('/', listComments);
router.post('/', createComment);
router.delete('/:commentId', deleteComment);

module.exports = router;
