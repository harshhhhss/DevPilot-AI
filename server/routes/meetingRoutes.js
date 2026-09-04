const express = require('express');
const {
  listMeetings,
  getMeeting,
  createMeeting,
  convertActionItem,
} = require('../controllers/meetingController');

const router = express.Router({ mergeParams: true });

router.get('/', listMeetings);
router.post('/', createMeeting);
router.get('/:id', getMeeting);
router.post('/:id/action-items/:itemId/convert', convertActionItem);

module.exports = router;
