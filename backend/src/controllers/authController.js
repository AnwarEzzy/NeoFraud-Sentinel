const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Check if user exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const user = await User.create(username, password, role);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            success: true,
            data: userWithoutPassword,
            message: 'User registered successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.status === 'BLOCKED') {
            const LogService = require('../services/logService');
            await LogService.logAction({ ...req, user: { username: user.username, role: user.role } }, 'LOGIN_FAILED', 'Blocked user attempted login');
            return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log Login
        const LogService = require('../services/logService');
        // Mock req object with user info since req.user isn't set yet (verifyToken does that)
        // But we have the user object here.
        // We can pass a mock object or modify LogService to accept user directly.
        // LogService uses req.user.username. Let's just create a mock req.
        const mockReq = { ...req, user: { username: user.username, role: user.role } };
        await LogService.logAction(mockReq, 'LOGIN', 'User logged in');

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            },
            message: 'Login successful'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMe = async (req, res) => {
    res.json({
        success: true,
        data: req.user,
        message: 'User profile'
    });
};
