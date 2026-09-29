// Vercel serverless function -> POST /api/chat
// Key is read from Vercel Dashboard > Settings > Environment Variables (GROK_API_KEY).
// Your key starts with "gsk_" (a Groq key), so requests are forwarded to Groq.

const UPSTREAM_URL = "https://api.groq.com/openai/v1/chat/completions";
const ALLOWED_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"];
const MAX_TOKENS_CAP = 12000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: "Server is missing GROK_API_KEY" } });

  try {
    const body = req.body || {};
    if (!ALLOWED_MODELS.includes(body.model)) {
      return res.status(400).json({ error: { message: "Model not allowed" } });
    }
    if (!Array.isArray(body.messages)) {
      return res.status(400).json({ error: { message: "messages required" } });
    }
    body.max_tokens = Math.min(Number(body.max_tokens) || 4000, MAX_TOKENS_CAP);
    delete body.stream;

    const r = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    res.status(r.status).setHeader("Content-Type", "application/json");
    return res.send(text);
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
  
