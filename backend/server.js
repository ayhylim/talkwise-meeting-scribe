import http from "http";
import fetch from "node-fetch";

const PORT = 3001;
const GEMINI_API_KEY = "AIzaSyB5C8bQ9_yrVQwqCWXZmmaVBYaTXVjwlEY"; // Use The Key Here

const server = http.createServer(async (req, res) => {
    // Add header Cors for All responses
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // ✅ IMPORTANT FIX: response preflight OPTIONS
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === "POST" && req.url === "/summarize") {
        let body = "";
        req.on("data", chunk => (body += chunk));
        req.on("end", async () => {
            try {
                const {transcript} = JSON.parse(body);

                const prompt = `
You are an AI assistant. Please generate a structured JSON object with the following fields:

{
  "summary": "short summary...",
  "key_points": ["point 1", "point 2", and others],
  "action_items": ["action 1", "action 2", and others],
  "identity": "optional if user asks",
  "language": "auto detect language and follow it"
}

Here's the transcript to analyze:
${transcript}
`;

                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            contents: [{role: "user", parts: [{text: prompt}]}]
                        })
                    }
                );

                const data = await geminiRes.json();
                console.log("📤 Gemini Response JSON:", JSON.stringify(data, null, 2));
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                console.log("📤 Raw Gemini Output:", rawText);

                let parsed = {};
                try {
                    parsed = JSON.parse(rawText);
                } catch (e) {
                    console.error("❌ Failed to parse Gemini response as JSON:", e);
                    parsed = {summary: rawText}; // fallback
                }

                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(parsed));
            } catch (err) {
                res.writeHead(500, {"Content-Type": "application/json"});
                res.end(JSON.stringify({error: "Gagal meringkas"}));
            }
        });
    } else {
        res.writeHead(404, {"Content-Type": "application/json"});
        res.end(JSON.stringify({error: "Endpoint tidak ditemukan"}));
    }
});

server.listen(PORT, () => {
    console.log(`✅ Talkwise Vanilla backend running at http://localhost:${PORT}`);
});
