const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/api/ideas', async (req, res) => {
    const API_URL = 'https://suitmedia-backend.suitdev.com/api/ideas';

    try {
        const queryString = new URLSearchParams(req.query).toString();

        const externalApiResponse = await fetch(`${API_URL}?${queryString}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const externalApiData = await externalApiResponse.json();
        if (!externalApiResponse.ok) {
            console.error('External API returned an error:', externalApiData);
            return res.status(externalApiResponse.status).json(externalApiData);
        }
        res.json(externalApiData);

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({
            message: 'Error fetching data from external API (proxy side error)',
            details: error.message
        });
    }
});
app.listen(PORT, () => {
    console.log(`✅ Proxy server berjalan di http://localhost:${PORT}`);
    console.log('Sekarang buka file index.html Anda di browser!');
});
