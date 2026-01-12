const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/stats', verifyToken, dashboardController.getStats);

module.exports = router;
