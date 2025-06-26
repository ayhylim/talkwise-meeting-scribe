gitimport asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import whisper
import tempfile
import os

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("base")

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    audio_buffer = bytearray()
    try:
        while True:
            data = await websocket.receive_bytes()
            audio_buffer.extend(data)

            # Save buffer to temp file for transcription
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_file:
                tmp_file.write(audio_buffer)
                tmp_filename = tmp_file.name

            # Transcribe audio file using Whisper
            result = model.transcribe(tmp_filename, language="id", fp16=False)
            transcript_text = result.get("text", "")

            # Send transcript back to client
            response = {
                "transcript": transcript_text.strip()
            }
            await websocket.send_text(json.dumps(response))

            # Remove temp file
            os.remove(tmp_filename)

            # Clear buffer after transcription to avoid reprocessing same audio
            audio_buffer.clear()

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
