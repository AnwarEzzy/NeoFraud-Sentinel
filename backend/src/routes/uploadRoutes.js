const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middlewares/authMiddleware');

const upload = multer({ dest: 'uploads/' });

// Route: POST /api/upload
router.post('/', verifyToken, upload.single('file'), uploadController.uploadCsv);

module.exports = router;
