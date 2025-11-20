import express from "express";
import fetch from "node-fetch"; // or native fetch in Node 20+
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/parse-receipt", async (req, res) => {
  const { receipt_text } = req.body;

  const prompt = `
You are a grocery parser. Extract items from this receipt text.
Return JSON array of objects: { "name": "...", "price": 0.0, "category": "..." }.
Receipt text:
${receipt_text}
`;

  const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    }),
  });

  const json = await aiResponse.json();
  const text = json.choices[0].message.content;

  try {
    const items = JSON.parse(text);
    res.json({ items });
  } catch {
    res.json({ items: [] });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
