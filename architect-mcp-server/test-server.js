import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_ENDPOINT = "http://localhost:11434";
const MODEL = "gemma4:e4b";

async function ollamaChat(messages) {
  console.log("[ollamaChat] Calling Ollama...");
  const payload = {
    model: MODEL,
    messages,
    stream: false,
    options: { num_predict: -1, temperature: 0.7 }
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);
  
  try {
    const res = await fetch(`${OLLAMA_ENDPOINT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log("[ollamaChat] Response status:", res.status);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama error ${res.status}: ${err}`);
    }
    const data = await res.json();
    console.log("[ollamaChat] Got response, length:", data.message.content.length);
    return data.message.content;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("[ollamaChat] Error:", err);
    throw err;
  }
}

app.post("/test", async (req, res) => {
  console.log("[/test] Request received");
  try {
    const answer = await ollamaChat([{ role: "user", content: req.body.question || "test" }]);
    console.log("[/test] Sending response");
    res.json({ answer });
  } catch (err) {
    console.error("[/test] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3002, () => console.log("Test server on :3002"));
