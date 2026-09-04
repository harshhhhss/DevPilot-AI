const express = require('express');
const {
  listUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(protect);

router.get('/', listUsers);
router.get('/:id', getUser);
router.put('/:id/role', authorize(ROLES.ADMIN), updateUserRole);
router.put('/:id/status', authorize(ROLES.ADMIN), updateUserStatus);
router.delete('/:id', authorize(ROLES.ADMIN), deleteUser);

module.exports = router;
