import http from "http";
import fetch from "node-fetch";

const PORT = 3001;
const GEMINI_API_KEY = ""; // Use The Key Here

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
You are an AI assistant. Please generate:
- A short summary.
- Key points.
- Action items (if any) from this transcript:

${transcript}
                `;

                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            contents: [{role: "user", parts: [{text: prompt}]}]
                        })
                    }
                );

                const data = await geminiRes.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({summary: text}));
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
