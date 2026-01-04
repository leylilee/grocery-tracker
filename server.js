import dotenv from "dotenv";
dotenv.config();

//.

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import Tesseract from "tesseract.js";
import fs from "fs";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple OCR endpoint
app.post("/api/parse-receipt", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "No image provided" });

  try {
    // Convert Base64 to Buffer
    const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    fs.writeFileSync("temp.png", buffer); // optional, just to debug

    const { data: { text } } = await Tesseract.recognize(buffer, "eng", {
      logger: m => console.log(m) // optional progress logging
    });

    // Simple text parsing: split by lines
    const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

    // Example: convert to JSON items if possible (rudimentary)
    const items = lines.map(line => {
      const match = line.match(/([a-zA-Z ]+)\s+(\d+(\.\d+)?)/); // item + price
      if (match) {
        return { name: match[1].trim(), price: parseFloat(match[2]), category: "Unknown" };
      }
      return null;
    }).filter(Boolean);

    res.json({ items, rawText: text });

  } catch (err) {
    console.error("OCR failed:", err);
    res.status(500).json({ error: "OCR failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));