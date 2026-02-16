require('dotenv').config();

const NOTION_KEY = process.env.NOTION_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function getFlashcards() {
  console.log("⏳ Sending direct POST request to Notion API...");

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28" // Current stable version
      },
      body: JSON.stringify({}) // Empty body gets all rows
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch");
    }

    const cards = data.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        question: props.Front?.title?.[0]?.plain_text || "No Question",
        answer: props.Back?.rich_text?.[0]?.plain_text || "No Answer",
      };
    });

    console.log("✅ Connection Successful!");
    console.table(cards);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

getFlashcards();