require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000; // Railway provides the PORT
const NOTION_KEY = process.env.NOTION_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// 1. Tell Express to serve the static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

app.get('/api/cards', async (req, res) => {
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NOTION_KEY}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28"
            },
            body: JSON.stringify({})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        const cards = data.results.map(page => ({
            id: page.id,
            question: page.properties.Front?.title?.[0]?.plain_text || "No Question",
            answer: page.properties.Back?.rich_text?.[0]?.plain_text || "No Answer",
            timesStudied: page.properties["Times Studied"]?.number || 0
        }));
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/update-card', async (req, res) => {
    const { pageId, level, currentTimesStudied } = req.body;
    try {
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${NOTION_KEY}`,
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
        if (!response.ok) throw new Error("Failed to update Notion");
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Handle any other requests by sending back the index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));