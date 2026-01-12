const Log = require('../models/Log');

class LogService {
    static async logAction(req, action, details) {
        const username = req?.user?.username || 'System';
        const role = req?.user?.role || 'SYSTEM';
        await Log.create(action, username, role, details);
    }
}

module.exports = LogService;
