const express = require('express');
const router = express.Router();
const { getSession } = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');

// Get all transactions (Admin/Analyst) or My transactions (Client)
// We need to know who the user is.
// If role is BANQUE (Banker) -> maybe all? Or specific.
// Requirement:
// ADMIN: Consulter toutes
// ANALYSTE: Consulter les transactions
// BANQUE: Consulter uniquement ses transactions (implies "Banque" is an agent creating them? Or Client? 
// The prompt says "BANQUE (Agent bancaire) - Consulter uniquement ses transactions".
// This is ambiguous. Does Agent own transactions? Or is it "Client"?
// Usually "Banker" manages customers.
// Let's assume User is linked to Account. User uploads CSV.
// If User uploaded it, maybe they can see it.
// For now: Admin/Analyst see ALL. 'BANQUE' (Agent) sees... maybe we link transactions to Agent? 
// Simplification: ADMIN/ANALYST see all. OTHERS see none or own.
// Let's implement "Get All" with pagination.

router.get('/', verifyToken, async (req, res) => {
    const session = getSession();
    const { role, username } = req.user;
    const limit = parseInt(req.query.limit) || 50;

    try {
        let query = '';
        let params = { limit: parseInt(limit) };

        if (role === 'ADMIN' || role === 'ANALYSTE') {
            query = `
        MATCH (t:Transaction)
        OPTIONAL MATCH (t)-[:HAS_ALERT]->(al:Alert)
        RETURN t, collect(al) as alerts
        ORDER BY t.date DESC LIMIT $limit
      `;
        } else {
            // Assuming 'BANQUE' or others only see transactions they have strict access to.
            // Since we don't have explicit "Agent manages Account" link yet, maybe show nothing or All?
            // Requirement: "Consulter uniquement ses transactions".
            // Maybe we interpret "BANQUE" as a Client user?
            // Let's match (u:User)-[:OWNS]->(a)-[:PERFORMED]->(t).
            query = `
        MATCH (u:User {username: $username})-[:OWNS]->(a:Account)-[:PERFORMED]->(t:Transaction)
        OPTIONAL MATCH (t)-[:HAS_ALERT]->(al:Alert)
        RETURN t, collect(al) as alerts
        ORDER BY t.date DESC LIMIT $limit
      `;
            params.username = username;
        }

        const result = await session.run(query, params);

        const transactions = result.records.map(record => {
            const t = record.get('t').properties;
            const alerts = record.get('alerts').map(a => a.properties);
            return { ...t, alerts };
        });

        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await session.close();
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    // Get details
    const session = getSession();
    const { id } = req.params;
    try {
        const result = await session.run(`
            MATCH (t:Transaction {txId: $id})
            OPTIONAL MATCH (t)-[:HAS_ALERT]->(al:Alert)
            OPTIONAL MATCH (a:Account)-[:PERFORMED]->(t)
            OPTIONAL MATCH (u:User)-[:OWNS]->(a)
            OPTIONAL MATCH (t)-[:TO_MERCHANT]->(m:Merchant)
            OPTIONAL MATCH (t)-[:FROM_DEVICE]->(d:Device)
            OPTIONAL MATCH (t)-[:FROM_IP]->(ip:IP)
            RETURN t, collect(al) as alerts, a, m, d, ip, u
        `, { id });

        if (result.records.length === 0) return res.status(404).json({ success: false, message: 'Not found' });

        const rec = result.records[0];

        // Helper to normalize Neo4j props
        const normalize = (props) => {
            if (!props) return null;
            const newProps = { ...props };
            // Convert 'date' or 'createdAt' if they exist and are possibly objects/integers
            if (newProps.date && typeof newProps.date === 'object') newProps.date = new Date(newProps.date).toISOString();
            if (newProps.createdAt && typeof newProps.createdAt === 'object') newProps.createdAt = new Date(newProps.createdAt).toISOString();
            return newProps;
        };

        const data = {
            transaction: normalize(rec.get('t').properties),
            alerts: rec.get('alerts').map(x => normalize(x.properties)),
            account: normalize(rec.get('a') ? rec.get('a').properties : null),
            merchant: normalize(rec.get('m') ? rec.get('m').properties : null),
            device: normalize(rec.get('d') ? rec.get('d').properties : null),
            ip: normalize(rec.get('ip') ? rec.get('ip').properties : null),
            user: normalize(rec.get('u') ? rec.get('u').properties : null)
        };

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
