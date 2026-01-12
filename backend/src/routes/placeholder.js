const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, message: 'Endpoint not implemented yet' });
});

module.exports = router;
