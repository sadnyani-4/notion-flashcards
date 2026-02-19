require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Tell Express to serve the static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

// New endpoint to provide demo credentials to the frontend
app.get('/api/demo-credentials', (req, res) => {
    res.json({
        notionKey: process.env.NOTION_KEY,
        dbId: process.env.NOTION_DATABASE_ID
    });
});

app.get('/api/cards', async (req, res) => {
    // Extract credentials from custom headers
    const userKey = req.headers['x-notion-key'];
    const userDbId = req.headers['x-notion-db-id'];

    if (!userKey || !userDbId) {
        return res.status(401).json({ error: "Notion Key or Database ID missing" });
    }

    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${userDbId}/query`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${userKey}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28"
            },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch from Notion");

        const cards = data.results.map(page => ({
            id: page.id,
            question: page.properties.Front?.title?.[0]?.plain_text || "No Question",
            answer: page.properties.Back?.rich_text?.[0]?.plain_text || "No Answer",
            timesStudied: page.properties["Times Studied"]?.number || 0
        }));
        res.json(cards);
    } catch (error) {
        console.error("Fetch Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/update-card', async (req, res) => {
    const { pageId, level, currentTimesStudied } = req.body;
    
    // Extract credentials from custom headers for the update too
    const userKey = req.headers['x-notion-key'];

    if (!userKey) {
        return res.status(401).json({ error: "Notion Key missing" });
    }

    try {
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${userKey}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28"
            },
            body: JSON.stringify({
                properties: {
                    "Level": { select: { name: level } },
                    "Last Reviewed": { date: { start: new Date().toISOString() } },
                    "Times Studied": { number: (currentTimesStudied || 0) + 1 }
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update Notion");
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error("Update Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Handle any other requests by sending back the index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));