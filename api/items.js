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

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // This is where you would typically fetch items from a database
        // For this example, we'll return dummy items
        const items = [
            { id: 1, name: "First Item", description: "This is the first item in your list" },
            { id: 2, name: "Second Item", description: "This is the second item in your list" },
            { id: 3, name: "Third Item", description: "This is the third item in your list" },
            { id: 4, name: "Fourth Item", description: "This is the fourth item in your list" },
            { id: 5, name: "Fifth Item", description: "This is the fifth item in your list" }
        ];

        // Return items
        return res.status(200).json(items);
    } catch (error) {
        console.error('Items fetch error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};