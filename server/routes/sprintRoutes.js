const express = require('express');
const {
  listSprints,
  getSprint,
  createSprint,
  updateSprint,
  deleteSprint,
  saveSprintRetrospective,
} = require('../controllers/sprintController');

const router = express.Router({ mergeParams: true });

router.get('/', listSprints);
router.post('/', createSprint);
router.get('/:id', getSprint);
router.put('/:id', updateSprint);
router.delete('/:id', deleteSprint);
router.put('/:id/retrospective', saveSprintRetrospective);

module.exports = router;
