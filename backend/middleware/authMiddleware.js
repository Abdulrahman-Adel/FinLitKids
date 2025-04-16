const jwt = require('jsonwebtoken');
const db = require('../config/db'); // May need db access later to check if user still exists

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error("JWT_SECRET is not defined in environment variables!");
                // Don't expose internal error details to client
                return res.status(401).json({ message: 'Not authorized, token failed (config error)' });
            }

            const decoded = jwt.verify(token, secret);

            // Attach user info to the request object (excluding sensitive info like password hash)
            // We might fetch fresh user data here if needed, but for now, payload is enough
            // Example: req.user = await db.query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
            req.user = {
                id: decoded.userId,
                type: decoded.userType, // 'parent' or 'child'
                email: decoded.email, // Only present for parent
                parentId: decoded.parentId, // Only present for child
                name: decoded.name // Only present for child
            };

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Optional: Middleware to restrict access based on user type (e.g., only parents)
const requireParent = (req, res, next) => {
    if (req.user && req.user.type === 'parent') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Parent access required' });
    }
};

// Optional: Middleware to restrict access based on user type (e.g., only children)
const requireChild = (req, res, next) => {
    if (req.user && req.user.type === 'child') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Child access required' });
    }
};


module.exports = { protect, requireParent, requireChild };