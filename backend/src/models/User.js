const { getSession } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async create(username, password, role = 'ANALYSTE') {
        const session = getSession();
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await session.run(
                `
        CREATE (u:User {
          id: randomUUID(),
          username: $username,
          password: $password,
          role: $role,
          status: 'ACTIVE',
          createdAt: datetime()
        })
        RETURN u
        `,
                { username, password: hashedPassword, role }
            );
            return result.records[0].get('u').properties;
        } finally {
            await session.close();
        }
    }

    static async findByUsername(username) {
        const session = getSession();
        try {
            const result = await session.run(
                `
        MATCH (u:User {username: $username})
        RETURN u
        `,
                { username }
            );
            if (result.records.length === 0) return null;
            return result.records[0].get('u').properties;
        } finally {
            await session.close();
        }
    }

    static async updateProfile(id, username, hashedPassword) {
        const session = getSession();
        try {
            // Need conditional query if password provided or not
            let query = '';
            let params = { id };

            if (hashedPassword) {
                query = `
                    MATCH (u:User {id: $id})
                    SET u.username = $username, u.password = $password
                    RETURN u
                `;
                params.username = username;
                params.password = hashedPassword;
            } else {
                query = `
                    MATCH (u:User {id: $id})
                    SET u.username = $username
                    RETURN u
                `;
                params.username = username;
            }

            const result = await session.run(query, params);
            return result.records[0].get('u').properties;
        } finally {
            await session.close();
        }
    }

    static async updateStatus(id, status) {
        const session = getSession();
        try {
            const result = await session.run(
                `
        MATCH (u:User {id: $id})
        SET u.status = $status
        RETURN u
        `,
                { id, status }
            );
            return result.records[0].get('u').properties;
        } finally {
            await session.close();
        }
    }

    static async updateRole(id, role) {
        const session = getSession();
        try {
            const result = await session.run(
                `
        MATCH (u:User {id: $id})
        SET u.role = $role
        RETURN u
        `,
                { id, role }
            );
            return result.records[0].get('u').properties;
        } finally {
            await session.close();
        }
    }

    static async delete(id) {
        const session = getSession();
        try {
            await session.run(
                `
        MATCH (u:User {id: $id})
        DETACH DELETE u
        `,
                { id }
            );
            return true;
        } finally {
            await session.close();
        }
    }
}

module.exports = User;
