const express = require('express');
const {
  listSprints,
  getSprint,
  createSprint,
  updateSprint,
  deleteSprint,
} = require('../controllers/sprintController');

const router = express.Router({ mergeParams: true });

router.get('/', listSprints);
router.post('/', createSprint);
router.get('/:id', getSprint);
router.put('/:id', updateSprint);
router.delete('/:id', deleteSprint);

module.exports = router;
