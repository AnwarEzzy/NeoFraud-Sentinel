const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAdmin, userController.getAllUsers);
router.post('/', verifyToken, isAdmin, userController.createUser);
router.patch('/:id/status', verifyToken, isAdmin, userController.updateUserStatus);
router.patch('/:id/role', verifyToken, isAdmin, userController.updateUserRole);
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

// Self-management routes
router.patch('/profile/me', verifyToken, userController.updateProfile);
router.delete('/profile/me', verifyToken, userController.deleteMyAccount);

module.exports = router;
