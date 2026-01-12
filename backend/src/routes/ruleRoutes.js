const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, ruleController.getRules);
router.post('/', verifyToken, isAdmin, ruleController.createRule);
router.patch('/:id', verifyToken, isAdmin, ruleController.updateRule);
router.delete('/:id', verifyToken, isAdmin, ruleController.deleteRule);

module.exports = router;
