import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/parse-receipt", async (req, res) => {
  const { receipt_text } = req.body;

  if (!receipt_text) {
    return res.status(400).json({ error: "No receipt text provided" });
  }

  try {
    const prompt = `
      Parse the following receipt text into a JSON array of items with name, price, and category:
      ${receipt_text}

      Output ONLY valid JSON. Example:
      [
        {"name": "Apple", "price": 1.5, "category": "Fruits & Vegetables"},
        {"name": "Milk", "price": 2.3, "category": "Dairy & Eggs"}
      ]
    `;

    // NEW SYNTAX for OpenAI API v6
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.choices[0].message.content;

    // Safely parse JSON
    let items;
    try {
      items = JSON.parse(text);
    } catch (e) {
      console.error("JSON parsing error:", e);
      return res.status(500).json({ error: "AI returned invalid JSON", raw: text });
    }

    res.json({ items });

  } catch (err) {
    console.error("AI parsing failed:", err);
    res.status(500).json({ error: "AI parsing failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
