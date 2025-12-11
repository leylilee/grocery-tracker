import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

app.post("/api/parse-receipt", async (req, res) => {
  const { receipt_text } = req.body;
  if (!receipt_text) return res.status(400).json({ error: "No receipt text provided" });

  try {
    const prompt = `
      Parse this receipt text into a JSON array of items with name, price, and category:
      ${receipt_text}

      Output example:
      [
        {"name": "Apple", "price": 1.5, "category": "Fruits & Vegetables"},
        {"name": "Milk", "price": 2.3, "category": "Dairy & Eggs"}
      ]
    `;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/groq/receipt-parser", // Replace with the model you want
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Hugging Face API error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // The model response is usually in data[0].generated_text
    let items;
    try {
      items = JSON.parse(data[0].generated_text);
    } catch {
      console.error("Invalid JSON from Hugging Face:", data[0].generated_text);
      return res.status(500).json({ error: "Invalid JSON returned from AI" });
    }

    res.json({ items });

  } catch (err) {
    console.error("AI parsing failed:", err);
    res.status(500).json({ error: "AI parsing failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
