const express = require('express');
const { listProjectActivity } = require('../controllers/activityController');

const router = express.Router({ mergeParams: true });

router.get('/', listProjectActivity);

module.exports = router;
