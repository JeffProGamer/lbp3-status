const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const cors = require('cors');

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const PORT = process.env.PORT || 3001; // Different port to avoid conflict
const API_URL = 'https://lbp3-server-remake.onrender.com'; // REPLACE with your Lighthouse API URL

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve status.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

// Proxy API requests with caching
app.get('/api/v1/*', async (req, res) => {
    const endpoint = req.path;
    const cacheKey = `api_${endpoint}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10s timeout
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        cache.set(cacheKey, data);
        res.json(data);
    } catch (error) {
        console.error(`API error at ${endpoint}:`, error.message);
        res.status(503).json({ error: 'Server unavailable or slow' });
    }
});

app.listen(PORT, () => {
    console.log(`Status server running on port ${PORT}`);
});