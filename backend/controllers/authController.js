const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Placeholder for Parent Signup
exports.parentSignup = async (req, res, next) => {
    const { email, password, name } = req.body; // Added name as optional

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Check if parent already exists
        const existingParent = await db.query('SELECT id FROM parents WHERE email = $1', [email]);
        if (existingParent.rows.length > 0) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        // Hash password
        const saltRounds = 10; // Standard practice
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new parent
        const queryText = 'INSERT INTO parents(email, password_hash, name) VALUES($1, $2, $3) RETURNING id, email, name, created_at';
        const queryParams = [email, passwordHash, name]; // Use name if provided, otherwise it will be NULL
        const result = await db.query(queryText, queryParams);

        // Respond with success and the created parent's basic info (excluding password hash)
        res.status(201).json({
            message: 'Parent account created successfully.',
            parent: result.rows[0]
        });

    } catch (err) {
        console.error('Parent Signup Error:', err);
        // Check for specific DB errors if needed (e.g., unique constraint violation)
        if (err.code === '23505' && err.constraint === 'parents_email_key') {
             // This check is technically redundant due to the explicit check above,
             // but good practice for catching race conditions or unexpected issues.
            return res.status(409).json({ message: 'Email already in use.' });
        }
        // Pass error to the generic error handler in server.js
        next(err);
    }
};

// Parent Login
exports.parentLogin = async (req, res, next) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find parent by email
        const queryText = 'SELECT id, email, password_hash, name FROM parents WHERE email = $1';
        const result = await db.query(queryText, [email]);
        const parent = result.rows[0];

        if (!parent) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // Use generic message for security
        }

        // Compare password with hash
        const isMatch = await bcrypt.compare(password, parent.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // Use generic message
        }

        // Passwords match - Generate JWT
        const payload = {
            userId: parent.id,
            userType: 'parent', // Differentiate between parent and child tokens
            email: parent.email,
        };

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not defined in environment variables!");
            return res.status(500).json({ message: 'Server configuration error.' });
        }

        const options = {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Use env variable or default
        };

        const token = jwt.sign(payload, secret, options);

        // Respond with token and basic parent info (excluding hash)
        res.status(200).json({
            message: 'Login successful.',
            token: token,
            parent: {
                id: parent.id,
                email: parent.email,
                name: parent.name,
            }
        });

    } catch (err) {
        console.error('Parent Login Error:', err);
        next(err); // Pass error to the generic error handler
    }
};

// Child Login
exports.childLogin = async (req, res, next) => {
    // We need parentId to uniquely identify the child along with their name
    const { parentId, username, password } = req.body;

    // Basic validation
    if (!parentId || !username || !password) {
        return res.status(400).json({ message: 'Parent ID, username, and password are required.' });
    }

    try {
        // Find child by parentId and name
        const queryText = 'SELECT id, name, password_hash, parent_id, balance, avatar_url FROM children WHERE parent_id = $1 AND name = $2';
        const result = await db.query(queryText, [parentId, username]);
        const child = result.rows[0];

        if (!child) {
            // Child not found for this parent or name is incorrect
            return res.status(401).json({ message: 'Invalid credentials.' }); // Generic message
        }

        // Compare password with hash
        const isMatch = await bcrypt.compare(password, child.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // Generic message
        }

        // Passwords match - Generate JWT
        const payload = {
            userId: child.id,
            userType: 'child', // Differentiate from parent
            parentId: child.parent_id, // Include parentId in payload might be useful
            name: child.name,
        };

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not defined in environment variables!");
            return res.status(500).json({ message: 'Server configuration error.' });
        }

        const options = {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Use env variable or default
        };

        const token = jwt.sign(payload, secret, options);

        // Respond with token and basic child info (excluding hash)
        res.status(200).json({
            message: 'Login successful.',
            token: token,
            child: {
                id: child.id,
                name: child.name,
                parentId: child.parent_id,
                balance: child.balance, // Send balance on login? Maybe.
                avatar_url: child.avatar_url
            }
        });

    } catch (err) {
        console.error('Child Login Error:', err);
        next(err); // Pass error to the generic error handler
    }
};

// Placeholder for Get Me (Get current user info)
// Get Me (Get current logged-in user info)
exports.getMe = async (req, res, next) => {
    // req.user is populated by the 'protect' middleware
    if (!req.user || !req.user.id || !req.user.type) {
        // This shouldn't happen if 'protect' middleware is working correctly
        return res.status(401).json({ message: 'Not authorized, user data missing' });
    }

    const { id, type } = req.user;

    try {
        let userQueryText;
        let userResult;

        if (type === 'parent') {
            userQueryText = 'SELECT id, email, name, created_at, updated_at FROM parents WHERE id = $1';
            userResult = await db.query(userQueryText, [id]);
        } else if (type === 'child') {
            // Select relevant child details, excluding password hash
            userQueryText = `
                SELECT
                    c.id, c.name, c.parent_id, c.balance, c.avatar_url,
                    c.allowance_enabled, c.allowance_amount, c.allowance_frequency,
                    c.spending_limit, c.spending_limit_frequency,
                    c.created_at, c.updated_at,
                    p.email as parent_email -- Optionally include parent email for context?
                FROM children c
                JOIN parents p ON c.parent_id = p.id
                WHERE c.id = $1
            `;
            userResult = await db.query(userQueryText, [id]);
        } else {
            // Unknown user type in token
            return res.status(401).json({ message: 'Not authorized, invalid user type' });
        }

        const user = userResult.rows[0];

        if (!user) {
            // User associated with token no longer exists
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // Respond with the user data, tailored by type
        res.status(200).json({ user });

    } catch (err) {
        console.error('Get Me Error:', err);
        next(err); // Pass error to the generic error handler
    }
};

// Placeholder for Logout
exports.logout = (req, res, next) => {
    // Implementation depends on how sessions/tokens are managed on the client
    res.status(501).json({ message: 'Logout controller not implemented yet' });
};
