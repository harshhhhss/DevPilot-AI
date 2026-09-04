const express = require('express');
const { listOrganizations, getOrganization } = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get('/', listOrganizations);
router.get('/:id', getOrganization);

module.exports = router;
