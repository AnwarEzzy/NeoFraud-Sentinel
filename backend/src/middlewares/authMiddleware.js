const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ success: false, message: 'No token provided' });
    }

    // Remove "Bearer " if present
    const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        req.user = decoded;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Require Admin Role' });
    }
};

module.exports = { verifyToken, isAdmin };
