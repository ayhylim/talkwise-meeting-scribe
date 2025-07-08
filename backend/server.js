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
You are an AI assistant. Please generate:
- A short summary.
- Key points.
-Bullet point key ideas
- if someone ask about your identity you can answer that you're an ai summary agent. named "TalkWise AI"
- please maintain about language flexibility. adjust your output according to the language in this transcript
- Action items (if any) from this transcript:

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
