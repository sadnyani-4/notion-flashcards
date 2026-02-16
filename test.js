require('dotenv').config()
const { Client } = require('@notionhq/client')

const notion = new Client({ auth: process.env.NOTION_KEY })
const databaseId = process.env.NOTION_DATABASE_ID

async function checkConnection() {
  try {
    const response = await notion.databases.retrieve({ database_id: databaseId })
    console.log("Success! I can see your database named:", response.title[0].plain_text)
  } catch (error) {
    console.error("Oops, something is wrong:", error.body)
  }
}

checkConnection()