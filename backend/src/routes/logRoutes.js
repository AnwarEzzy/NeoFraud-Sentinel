const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, logController.getLogs);

module.exports = router;
