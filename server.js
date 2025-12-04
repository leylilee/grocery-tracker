import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import cors from "cors";

const app = express();
import cors from "cors";
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/parse-receipt", async (req, res) => {
  const { receipt_text } = req.body;
  
  if (!receipt_text) return res.status(400).json({ error: "No receipt text provided" });

  try {
    const prompt = `
      Parse the following receipt text into a JSON array of items with name, price, and category:
      ${receipt_text}

      Output example:
      [
        {"name": "Apple", "price": 1.5, "category": "Fruits & Vegetables"},
        {"name": "Milk", "price": 2.3, "category": "Dairy & Eggs"}
      ]
    `;

    // Safer JSON parsing
    let items;
    try {
      items = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error("Failed to parse AI response as JSON:", err);
      console.log("AI response text:", completion.choices[0].message.content);
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    res.json({ items });

  } catch (err) {
    console.error("AI parsing failed:", err);
    res.status(500).json({ error: "AI parsing failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
