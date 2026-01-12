const Rule = require('../models/Rule');
const LogService = require('../services/logService');

exports.getRules = async (req, res) => {
    try {
        const rules = await Rule.getAll();
        res.json({ success: true, data: rules });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createRule = async (req, res) => {
    try {
        let { name, description, type, status, cypherQuery, parameters, threshold } = req.body;

        // If template type is provided, generate query
        if (!cypherQuery && type) {
            switch (type) {
                case 'MONTANT_ELEVE':
                    cypherQuery = `
            MATCH (t:Transaction)
            WHERE t.amount > $threshold AND NOT (t)-[:HAS_ALERT]->(:Alert {rule: 'MONTANT_ELEVE'})
            CREATE (a:Alert {
                id: randomUUID(),
                rule: 'MONTANT_ELEVE',
                severity: 'HIGH',
                status: 'NEW',
                createdAt: datetime(),
                description: 'Transaction amount ' + t.amount + ' exceeds threshold ' + $threshold
            })
            CREATE (t)-[:HAS_ALERT]->(a)
            RETURN count(a) as count
            `;
                    threshold = parseFloat(threshold) || 10000.0;
                    break;
                case 'IP_PARTAGEE':
                    cypherQuery = `
            MATCH (ip:IP)<-[:FROM_IP]-(t:Transaction)<-[:PERFORMED]-(a:Account)
            WITH ip, count(distinct a) as accountCount, collect(t) as txs
            WHERE accountCount >= $threshold
            UNWIND txs as t
            MATCH (t) WHERE NOT (t)-[:HAS_ALERT]->(:Alert {rule: 'IP_PARTAGEE'})
            CREATE (al:Alert {
                id: randomUUID(),
                rule: 'IP_PARTAGEE',
                severity: 'CRITICAL',
                status: 'NEW',
                createdAt: datetime(),
                description: 'IP used by ' + accountCount + ' distinct accounts (Threshold: ' + $threshold + ')'
            })
            CREATE (t)-[:HAS_ALERT]->(al)
            RETURN count(al) as count
            `;
                    threshold = parseInt(threshold) || 2;
                    break;
                case 'TRANSACTIONS_RAPIDES':
                    cypherQuery = `
            MATCH (a:Account)-[:PERFORMED]->(t:Transaction)
            WITH a, t
            MATCH (a)-[:PERFORMED]->(other:Transaction)
            WHERE other.txId <> t.txId 
              AND abs(duration.inSeconds(t.date, other.date).seconds) < 600
            WITH t, count(other) as recentCount
            WHERE recentCount >= $threshold AND NOT (t)-[:HAS_ALERT]->(:Alert {rule: 'TRANSACTIONS_RAPIDES'})
            CREATE (al:Alert {
                id: randomUUID(),
                rule: 'TRANSACTIONS_RAPIDES',
                severity: 'MEDIUM',
                status: 'NEW',
                createdAt: datetime(),
                description: 'High velocity: ' + recentCount + ' transactions in short period'
            })
            CREATE (t)-[:HAS_ALERT]->(al)
            RETURN count(al) as count
           `;
                    threshold = parseInt(threshold) || 5;
                    break;
                case 'MULTI_COMPTES':
                    cypherQuery = `
            MATCH (d:Device)<-[:FROM_DEVICE]-(t:Transaction)<-[:PERFORMED]-(a:Account)
            WITH d, count(distinct a) as accountsLinked
            WHERE accountsLinked >= $threshold
            MATCH (d)<-[:FROM_DEVICE]-(t2:Transaction)
            WHERE NOT (t2)-[:HAS_ALERT]->(:Alert {rule: 'MULTI_COMPTES'})
            CREATE (al:Alert {
                id: randomUUID(),
                rule: 'MULTI_COMPTES',
                severity: 'CRITICAL',
                status: 'NEW',
                createdAt: datetime(),
                description: 'Device linked to ' + accountsLinked + ' accounts'
            })
            CREATE (t2)-[:HAS_ALERT]->(al)
            RETURN count(al) as count
            `;
                    threshold = parseInt(threshold) || 2;
                    break;
                default:
                    // If unknown type and no query, error or fallback?
                    // Let's assume user might be just labelling. But better error if no query.
                    if (!cypherQuery) throw new Error("Cypher Query is required for custom rules");
            }
        } else if (!cypherQuery) {
            throw new Error("Cypher Query is required");
        }

        const rule = await Rule.create(name, description, type, cypherQuery, threshold, parameters);

        // Handle explicit Status 'Inactive' from form (default is true/active in model)
        if (status === 'Inactive') {
            await Rule.update(rule.id, { enabled: false });
        }

        await LogService.logAction(req, 'CREATE_RULE', `Created rule: ${name}`);
        res.status(201).json({ success: true, data: rule });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateRule = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const rule = await Rule.update(id, updates);
        await LogService.logAction(req, 'UPDATE_RULE', `Updated rule: ${rule.name}`);
        res.json({ success: true, data: rule });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        await Rule.delete(id);
        await LogService.logAction(req, 'DELETE_RULE', `Deleted rule ${id}`);
        res.json({ success: true, message: 'Rule deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
