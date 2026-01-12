const { getSession } = require('../config/db');

exports.getStats = async (req, res) => {
    const session = getSession();
    try {
        console.log('Dashboard Stats requested by', req.user.username); // Debug log

        const stats = {
            counts: {},
            roles: {},
            recentActivity: [],
            systemStatus: {
                backend: true,
                neo4j: true,
                jwt: !!process.env.JWT_SECRET
            }
        };

        // 1. Main Indicators (Counts) + Agent Specifics (Import CSV count, Last Detection)
        const countsResult = await session.run(`
            CALL { MATCH (u:User) RETURN count(u) as totalUsers }
            CALL { MATCH (t:Transaction) RETURN count(t) as totalTransactions }
            CALL { MATCH (a:Alert) RETURN count(a) as totalAlerts }
            CALL { MATCH (r:Rule) WHERE r.enabled = true RETURN count(r) as activeRules }
            CALL { MATCH (l:Log {action: 'IMPORT_CSV'}) RETURN count(l) as totalImportFiles }
            CALL { MATCH (l:Log {action: 'DETECTION_RUN'}) RETURN max(l.createdAt) as lastDetection }
            
            CALL { MATCH (a:Alert) WHERE a.status = 'NEW' RETURN count(a) as totalPending }
            CALL { MATCH (a:Alert) WHERE a.status = 'VALIDATED' RETURN count(a) as totalValidated }
            CALL { MATCH (a:Alert) WHERE a.status = 'REJECTED' RETURN count(a) as totalRejected }

            RETURN totalUsers, totalTransactions, totalAlerts, activeRules, totalImportFiles, lastDetection, totalPending, totalValidated, totalRejected
        `);

        if (countsResult.records.length > 0) {
            const rec = countsResult.records[0];
            stats.counts = {
                totalUsers: rec.get('totalUsers').toNumber(),
                totalTransactions: rec.get('totalTransactions').toNumber(),
                totalAlerts: rec.get('totalAlerts').toNumber(),
                activeRules: rec.get('activeRules') ? rec.get('activeRules').toNumber() : 0,
                totalImportFiles: rec.get('totalImportFiles') ? rec.get('totalImportFiles').toNumber() : 0,
                lastDetection: rec.get('lastDetection') ? new Date(rec.get('lastDetection').toString()).toISOString() : null,
                totalPending: rec.get('totalPending') ? rec.get('totalPending').toNumber() : 0,
                totalValidated: rec.get('totalValidated') ? rec.get('totalValidated').toNumber() : 0,
                totalRejected: rec.get('totalRejected') ? rec.get('totalRejected').toNumber() : 0
            };
        }

        // 2. Role Distribution
        const rolesResult = await session.run(`
            MATCH (u:User)
            RETURN u.role as role, count(u) as count
        `);

        const rolesMap = { ADMIN: 0, ANALYSTE: 0, BANQUE: 0 };
        rolesResult.records.forEach(rec => {
            const r = rec.get('role');
            const c = rec.get('count').toNumber();
            rolesMap[r] = c;
        });
        stats.roles = rolesMap;

        // 3. Recent Activity (Logs) - General
        const logsResult = await session.run(`
            MATCH (l:Log)
            WHERE l.action IN ['LOGIN', 'IMPORT_CSV', 'DETECTION_RUN', 'CREATE_USER', 'UPDATE_USER_ROLE', 'UPDATE_USER_STATUS', 'DELETE_USER']
            RETURN l
            ORDER BY l.createdAt DESC
            LIMIT 10
        `);

        stats.recentActivity = logsResult.records.map(rec => {
            const props = rec.get('l').properties;
            return {
                action: props.action,
                date: props.createdAt ? new Date(props.createdAt.toString()).toISOString() : null,
                details: props.details,
                username: props.username,
                role: props.role
            };
        });

        // 4. Recent Imports (Specific for Agent Dashboard)
        const recentImportsResult = await session.run(`
            MATCH (l:Log {action: 'IMPORT_CSV'})
            RETURN l
            ORDER BY l.createdAt DESC
            LIMIT 5
        `);

        stats.recentImports = recentImportsResult.records.map(rec => {
            const props = rec.get('l').properties;
            // Attempt to extract filename from details if possible, typically "Imported X transactions from filename.csv"
            let filename = "Unknown File";
            if (props.details && props.details.includes('from ')) {
                filename = props.details.split('from ')[1];
            }
            return {
                filename,
                date: props.createdAt ? new Date(props.createdAt.toString()).toISOString() : null,
                status: 'Success', // Logs usually imply success if they exist here, errors might have Error logs
                details: props.details
            };
        });

        // 5. Alerts by Rule 
        const alertsByRuleRes = await session.run(`
             MATCH (a:Alert)
             RETURN a.rule as rule, count(a) as count
             ORDER BY count DESC
             LIMIT 5
        `);
        stats.alertsByRule = alertsByRuleRes.records.map(r => ({
            rule: r.get('rule'),
            count: r.get('count').toNumber()
        }));

        // 5b. Alerts by Severity (Risk Stats)
        const severityRes = await session.run(`
            MATCH (a:Alert)
            RETURN a.severity as severity, count(a) as count
        `);
        stats.riskStats = { critical: 0, medium: 0, low: 0 };
        severityRes.records.forEach(r => {
            const sev = r.get('severity');
            const cnt = r.get('count').toNumber();
            if (sev === 'CRITICAL') stats.riskStats.critical = cnt;
            else if (sev === 'MEDIUM' || sev === 'HIGH') stats.riskStats.medium += cnt;
            else stats.riskStats.low += cnt;
        });

        // 6. Recent Alerts (For Analyst Dashboard)
        const recentAlertsRes = await session.run(`
            MATCH (a:Alert)<-[:HAS_ALERT]-(t:Transaction)
            RETURN a, t
            ORDER BY a.createdAt DESC
            LIMIT 5
        `);
        stats.recentAlerts = recentAlertsRes.records.map(r => ({
            ...r.get('a').properties,
            txId: r.get('t').properties.txId,
            amount: r.get('t').properties.amount,
            date: r.get('a').properties.createdAt.toString() // Convert date
        }));

        res.json({ success: true, data: stats });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await session.close();
    }
};
