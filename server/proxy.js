/* Simple proxy for Foursquare Places API to avoid CORS during local development

*/

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

const FOURSQUARE_KEY = process.env.FOURSQUARE_KEY || '';

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.get('/places', async (req, res) => {
    const q = req.query.query || '';
    const limit = req.query.limit || '5';
    if (!q) return res.json({ results: [] });
    try {
        const url = `https://places-api.foursquare.com/autocomplete?query=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`;
        const r = await fetch(url, {
            headers: {
                Authorization: `Bearer ${FOURSQUARE_KEY}`,
                Accept: 'application/json',
                'X-Places-Api-Version': '2025-06-17',
            }
        });
        const data = await r.json();
        res.json(data);
    } catch (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error' });
    }
});

app.listen(PORT, () => console.log(`Places proxy running on http://localhost:${PORT}`));
