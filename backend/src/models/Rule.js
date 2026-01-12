const { getSession } = require('../config/db');

class Rule {
    static async create(name, description, type, cypherQuery, thresholdValue, userDefinedParams = {}) {
        const session = getSession();
        try {
            const result = await session.run(
                `
        CREATE (r:Rule {
          id: randomUUID(),
          name: $name,
          description: $description,
          type: $type,
          cypherQuery: $cypherQuery,
          parameters: $parameters,
          enabled: true,
          createdAt: datetime()
        })
        CREATE (t:Threshold {
            id: randomUUID(),
            value: $thresholdValue
        })
        CREATE (r)-[:USES]->(t)
        RETURN r, t
        `,
                {
                    name,
                    description,
                    type,
                    cypherQuery,
                    thresholdValue,
                    parameters: JSON.stringify(userDefinedParams)
                }
            );
            const r = result.records[0].get('r').properties;
            const t = result.records[0].get('t').properties;
            return { ...r, threshold: t.value };
        } finally {
            await session.close();
        }
    }

    static async getAll() {
        const session = getSession();
        try {
            const result = await session.run(
                `
        MATCH (r:Rule)
        OPTIONAL MATCH (r)-[:USES]->(t:Threshold)
        RETURN r, t
        ORDER BY r.name
        `
            );
            return result.records.map(rec => {
                const rProps = rec.get('r').properties;
                const tProps = rec.get('t') ? rec.get('t').properties : {};

                try {
                    rProps.parameters = JSON.parse(rProps.parameters || '{}');
                } catch (e) { rProps.parameters = {}; }

                return {
                    ...rProps,
                    threshold: tProps.value // Lift threshold value to top level
                };
            });
        } finally {
            await session.close();
        }
    }

    static async update(id, updates) {
        const session = getSession();
        try {
            // updates might contain 'threshold'. 
            // We need to separate rule updates from threshold updates.
            const { threshold, ...ruleUpdates } = updates;

            if (ruleUpdates.parameters) {
                ruleUpdates.parameters = JSON.stringify(ruleUpdates.parameters);
            }

            let query = `MATCH (r:Rule {id: $id}) SET r += $ruleUpdates`;
            if (threshold !== undefined) {
                query += `
                WITH r
                MERGE (r)-[:USES]->(t:Threshold)
                SET t.value = $threshold
                `;
            }
            query += ` RETURN r`;

            const result = await session.run(query, { id, ruleUpdates, threshold });
            return result.records[0]?.get('r').properties;
        } finally {
            await session.close();
        }
    }

    static async delete(id) {
        const session = getSession();
        try {
            await session.run(`
                MATCH (r:Rule {id: $id})
                OPTIONAL MATCH (r)-[:USES]->(t:Threshold)
                DETACH DELETE r, t
            `, { id });
        } finally {
            await session.close();
        }
    }
}

module.exports = Rule;

