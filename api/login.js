const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// Secret key for JWT (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only accept POST method
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Get token from request body
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, error: 'Token is required' });
        }

        // Validate Google token
        const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
        const googleData = await googleRes.json();

        if (googleData.error) {
            return res.status(401).json({ success: false, error: 'Invalid Google token' });
        }

        // Get user information from Google
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userInfo = await userInfoRes.json();

        // Create a JWT token for our backend
        const sessionToken = jwt.sign(
            {
                sub: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(sessionToken)

        // Return success with backend token
        return res.status(200).json({
            success: true,
            token: sessionToken,
            user: {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};