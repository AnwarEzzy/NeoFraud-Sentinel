const { getSession } = require('../config/db');

class Log {
    static async create(action, username, role, details, severity = 'INFO') {
        const session = getSession();
        try {
            await session.run(
                `
        CREATE (l:Log {
          id: randomUUID(),
          action: $action,
          username: $username,
          role: $role,
          details: $details,
          severity: $severity,
          createdAt: datetime()
        })
        `,
                { action, username, role, details, severity }
            );
        } catch (err) {
            console.error('Failed to write log:', err);
        } finally {
            await session.close();
        }
    }

    static async getAll(limit = 100) {
        const session = getSession();
        try {
            // Explicitly return properties to avoid Node object issues
            const result = await session.run(
                `
        MATCH (l:Log)
        RETURN l.id AS id, l.action AS action, l.username AS username, l.role AS role, l.details AS details, l.severity AS severity, l.createdAt AS createdAt
        LIMIT toInteger($limit)
        `,
                { limit }
            );

            return result.records.map(r => {
                const props = {
                    id: r.get('id'),
                    action: r.get('action'),
                    username: r.get('username'),
                    role: r.get('role'),
                    details: r.get('details'),
                    severity: r.get('severity'),
                    createdAt: r.get('createdAt')
                };

                // Robust date conversion
                if (props.createdAt) {
                    if (typeof props.createdAt.toString === 'function') {
                        props.createdAt = props.createdAt.toString();
                    } else if (typeof props.createdAt === 'object') {
                        props.createdAt = JSON.stringify(props.createdAt).replace(/"/g, '');
                    }
                }
                return props;
            });
        } catch (err) {
            console.error("Error in Log.getAll:", err);
            return []; // Return empty array on error
        } finally {
            await session.close();
        }
    }
}

module.exports = Log;
