import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }]
    });

    // The AI returns text; parse it to JSON
    const items = JSON.parse(completion.choices[0].message.content);
    res.json({ items });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI parsing failed" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
