const express = require('express');
const { getProjectAnalytics } = require('../controllers/analyticsController');

const router = express.Router({ mergeParams: true });

router.get('/', getProjectAnalytics);

module.exports = router;
