const express = require('express');
const router = express.Router();
const { getSession } = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');
const DetectionService = require('../services/detectionService');

// Run detection manually
router.post('/detect', verifyToken, async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'AGENT') return res.status(403).json({ success: false, message: 'Forbidden' });
    try {
        const stats = await DetectionService.runDetection();

        const LogService = require('../services/logService');
        await LogService.logAction(req, 'DETECTION_RUN', `Manual detection triggered. New alerts: ${stats.newAlerts}`);

        res.json({ success: true, data: stats, message: 'Detection ran successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/', verifyToken, async (req, res) => {
    const session = getSession();
    // Only Admin/Analyst? Or User's alerts?
    // "BANQUE: Consulter ces alertes associées"
    const { role, username } = req.user;

    try {
        let query = '';
        let params = {};

        if (role === 'ADMIN' || role === 'ANALYSTE' || role === 'AGENT') {
            query = `
                MATCH (u:User)-[:OWNS]->(acc:Account)-[:PERFORMED]->(t:Transaction)-[:HAS_ALERT]->(al:Alert)
                RETURN al, t, u.username as username, acc.accountId as accountId
                ORDER BY al.createdAt DESC
            `;
        } else {
            query = `
                MATCH (u:User {username: $username})-[:OWNS]->(acc:Account)-[:PERFORMED]->(t:Transaction)-[:HAS_ALERT]->(al:Alert)
                RETURN al, t, u.username as username, acc.accountId as accountId
                ORDER BY al.createdAt DESC
            `;
            params.username = username;
        }

        const result = await session.run(query, params);

        const normalize = (props) => {
            if (!props) return null;
            const newProps = { ...props };
            if (newProps.date && typeof newProps.date === 'object') newProps.date = new Date(newProps.date).toISOString();
            if (newProps.createdAt && typeof newProps.createdAt === 'object') newProps.createdAt = new Date(newProps.createdAt).toISOString();
            return newProps;
        };

        const alerts = result.records.map(r => ({
            alert: { ...normalize(r.get('al').properties), createdAt: normalize(r.get('al').properties).createdAt },
            transaction: normalize(r.get('t').properties),
            userInfo: {
                username: r.get('username'),
                accountId: r.get('accountId')
            }
        }));

        res.json({ success: true, data: alerts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await session.close();
    }
});

// Update Alert Status (Resolve)
router.patch('/:id/resolve', verifyToken, async (req, res) => {
    if (req.user.role !== 'ANALYSTE' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only Analysts/Admins can resolve alerts' });
    }
    const { id } = req.params;
    const { status, comment } = req.body; // Expect status and comment
    const newStatus = status || 'RESOLVED';

    const session = getSession();
    try {
        await session.run(`
            MATCH (al:Alert {id: $id})
            SET al.status = $newStatus, 
                al.resolvedAt = datetime(), 
                al.resolvedBy = $username,
                al.resolutionComment = $comment
            RETURN al
        `, { id, username: req.user.username, newStatus, comment: comment || '' });
        res.json({ success: true, message: `Alert marked as ${newStatus}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
