const express = require('express');
const {
  generateSprintPlan,
  generateUserStory,
  prioritizeTask,
  analyzeBug,
  analyzeRisk,
  summarizeMeeting,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/sprint-plan', generateSprintPlan);
router.post('/user-story', generateUserStory);
router.post('/prioritize-task', prioritizeTask);
router.post('/analyze-bug', analyzeBug);
router.post('/analyze-risk', analyzeRisk);
router.post('/summarize-meeting', summarizeMeeting);

module.exports = router;
