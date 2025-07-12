import http from "http";
import fetch from "node-fetch";
import "dotenv/config";

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
    // Add CORS headers for all responses
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // ✅ Handle CORS preflight OPTIONS
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
                const { transcript } = JSON.parse(body);

                const prompt = `
You are an AI assistant named TalkWise AI. 
Based on the following transcript, generate a summary in JSON format.

⚠️ IMPORTANT RULE:
You must detect and follow the language used in the transcript. 
YOU MAY NOT SWITCH OR TRANSLATE YOUR OUTPUT!
WHEN YOU SUMMARIZE YOU HAVE TO USE ENGLISH LANGUAGE




Make sure:
- The language of the summary matches the language used in the transcript. You may not switch or translate.
- You DO NOT wrap the response in markdown or code blocks.
- The style is friendly and human-like, not robotic.

Respond with this structure:

{
  "title": "...",
  "summary": "...",
  "key_points": ["..."],
  "action_items": ["..."]
}

Transcript:
${transcript}
`;

                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ role: "user", parts: [{ text: prompt }] }]
                        })
                    }
                );

                const data = await geminiRes.json();
                console.log("📤 Gemini Response JSON:", JSON.stringify(data, null, 2));
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                console.log("📤 Raw Gemini Output:", rawText);

                let parsed = {};
                try {
                    // Remove Markdown wrapper like ```json\n...\n```
                    const jsonStart = rawText.indexOf("{");
                    const jsonEnd = rawText.lastIndexOf("}") + 1;
                    const jsonCandidate = rawText.slice(jsonStart, jsonEnd);
                    parsed = JSON.parse(jsonCandidate);
                } catch (e) {
                    console.error("❌ Failed to parse Gemini response as JSON:", e);
                    parsed = { summary: rawText }; // fallback
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(parsed));
            } catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Failed to summarize" }));
            }
        });
    } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Endpoint not found" }));
    }
});

server.listen(PORT, () => {
    console.log(`✅ TalkWise Vanilla backend running at http://localhost:${PORT}`);
});
