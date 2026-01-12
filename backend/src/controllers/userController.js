const { getSession } = require('../config/db');
const User = require('../models/User');
const LogService = require('../services/logService');

exports.getAllUsers = async (req, res) => {
    const session = getSession();
    try {
        const result = await session.run(
            `
      MATCH (u:User)
      RETURN u.id AS id, u.username AS username, u.role AS role, u.status AS status, u.createdAt AS createdAt
      ORDER BY u.createdAt DESC
      `
        );

        const users = result.records.map(record => ({
            id: record.get('id'),
            username: record.get('username'),
            role: record.get('role'),
            status: record.get('status') || 'ACTIVE', // Default for old users
            createdAt: record.get('createdAt') ? new Date(record.get('createdAt')).toISOString() : null
        }));

        res.json({
            success: true,
            data: users,
            message: 'Users retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await session.close();
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Basic Validation
        if (!username || !password || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const existing = await User.findByUsername(username);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const user = await User.create(username, password, role);
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        await LogService.logAction(req, 'CREATE_USER', `User ${username} created with role ${role}`);

        res.status(201).json({
            success: true,
            data: userWithoutPassword,
            message: 'User created successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.delete(id);
        await LogService.logAction(req, 'DELETE_USER', `User ${id} deleted`);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['ACTIVE', 'BLOCKED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updatedUser = await User.updateStatus(id, status);

        // Log the action
        await LogService.logAction(req, 'UPDATE_USER_STATUS', `User ${updatedUser.username} status changed to ${status}`);

        res.json({ success: true, data: updatedUser, message: 'User status updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['ADMIN', 'ANALYSTE', 'BANQUE'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const updatedUser = await User.updateRole(id, role);

        // Log the action (Role is stored in log node, but here we log the action of *changing* a role)
        // LogService automatically captures "who" did it (req.user).
        // We describe "what" happened.
        const LogService = require('../services/logService');
        await LogService.logAction(req, 'UPDATE_USER_ROLE', `Changed role of ${updatedUser.username} to ${role}`);

        res.json({ success: true, data: updatedUser, message: 'User role updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, password } = req.body;

        if (!username) {
            return res.status(400).json({ success: false, message: 'Username is required' });
        }

        let hashedPassword = null;
        if (password && password.trim() !== "") {
            const bcrypt = require('bcryptjs');
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.updateProfile(userId, username, hashedPassword);

        const LogService = require('../services/logService');
        await LogService.logAction(req, 'UPDATE_PROFILE', `User updated their profile (Username: ${username})`);

        res.json({ success: true, data: { username: updatedUser.username, role: updatedUser.role }, message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        await User.delete(userId);

        const LogService = require('../services/logService');
        await LogService.logAction(req, 'DELETE_ACCOUNT', `User ${req.user.username} deleted their own account`);

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};