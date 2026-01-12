const { getSession } = require('../config/db');
const Rule = require('../models/Rule');

class DetectionService {

    static async initDefaultRules() {
        // Only init if no rules exist
        const rules = await Rule.getAll();
        if (rules.length > 0) return;

        console.log("Initializing default fraud rules based on specification...");

        // 1. MONTANT_ELEVE (High Amount)
        await Rule.create(
            'MONTANT_ELEVE',
            'Transaction amount exceeds defined threshold',
            'AMOUNT_THRESHOLD',
            `
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
            `,
            10000.0 // Default Threshold
        );

        // 2. IP_PARTAGEE (Shared IP)
        await Rule.create(
            'IP_PARTAGEE',
            'IP address used by multiple users',
            'SHARED_RESOURCE',
            `
            MATCH (ip:IP)<-[:FROM_IP]-(t:Transaction)<-[:PERFORMED]-(a:Account)
            // Assuming Account is linked to User, or Account represents the user entity in this context
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
            `,
            2 // Threshold: 2 or more users
        );

        // 3. TRANSACTIONS_RAPIDES (High Velocity)
        await Rule.create(
            'TRANSACTIONS_RAPIDES',
            'Multiple transactions in a short period',
            'VELOCITY',
            `
            MATCH (a:Account)-[:PERFORMED]->(t:Transaction)
            WITH a, t
            MATCH (a)-[:PERFORMED]->(other:Transaction)
            WHERE other.txId <> t.txId 
              AND abs(duration.inSeconds(t.date, other.date).seconds) < 600 // 10 minutes window hardcoded or param? Spec says 'short time'.
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
           `,
            5 // Threshold: 5 transactions
        );

        // 4. MULTI_COMPTES (One user, multiple accounts)
        // Note: Our data model might not explicitly have 'User' separate from 'Account' in terms of graph for simple CSV ingestion.
        // Usually CSV has accountId. If 'User' entity exists, we link User -> Account.
        // If not, we can assume 'Multi-Account Device' approximates 'Multi-Account' if we don't have explicit User ownership data.
        // But let's write the query assuming a User node exists or we check common identifiers.
        // For now, let's use the Shared Device logic as a proxy for "One entity controlling multiple accounts".
        await Rule.create(
            'MULTI_COMPTES',
            'Single user/device associated with multiple accounts',
            'ENTITY_LINK',
            `
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
            `,
            2 // Threshold: 2 accounts
        );

        console.log("Default rules initialized.");
    }

    static async runDetection() {
        await this.initDefaultRules();

        const session = getSession();
        const rules = await Rule.getAll(); // Now includes .threshold
        const stats = { newAlerts: 0, rulesExecuted: 0 };

        try {
            for (const rule of rules) {
                if (!rule.enabled) continue;

                // Prepare params
                let params = rule.parameters || {};

                // Inject the distinct 'threshold' value into parameters as '$threshold'
                if (rule.threshold !== undefined && rule.threshold !== null) {
                    params.threshold = rule.threshold;
                }

                try {
                    const result = await session.run(rule.cypherQuery, params);
                    if (result.records.length > 0 && result.records[0].keys.includes('count')) {
                        stats.newAlerts += result.records[0].get('count').toNumber();
                    }
                    stats.rulesExecuted++;
                } catch (ruleErr) {
                    console.error(`Error executing rule ${rule.name}:`, ruleErr);
                }
            }
        } catch (err) {
            console.error("Detection Error:", err);
            throw err;
        } finally {
            await session.close();
        }

        return stats;
    }
}

module.exports = DetectionService;
