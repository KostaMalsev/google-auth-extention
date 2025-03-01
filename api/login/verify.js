const jwt = require('jsonwebtoken');

// Secret key for JWT (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only accept GET method
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Get authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Authorization header required' });
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        console.log('verify got jwt token:', token, 'decoded:', jwt.verify(token, JWT_SECRET)); //TBD@@

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Return user info
        return res.status(200).json({
            success: true,
            user: {
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
};