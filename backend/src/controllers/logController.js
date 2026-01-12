const Log = require('../models/Log');

exports.getLogs = async (req, res) => {
    try {
        const limit = req.query.limit || 100;
        const logs = await Log.getAll(limit);
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
