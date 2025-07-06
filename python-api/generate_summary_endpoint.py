from flask import request, jsonify
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_summary():
    try:
        data = request.get_json()
        transcript = data.get('transcript', '').strip()
        if not transcript:
            return jsonify({"error": "Transcript is required"}), 400

        system_message = {
            "role": "system",
            "content": "You are an AI assistant that summarizes meeting transcripts."
        }

        user_message = {
            "role": "user",
            "content": f"""
Given the following transcript, provide a JSON object with the following fields:
- summary: A detailed explanation summary of the meeting.
- key_points: A list of concise bullet points summarizing the main points.
- action_items: A list of key action items if any.

Transcript:
{transcript}

Respond ONLY with a valid JSON object.
"""
        }

        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[system_message, user_message],
                temperature=0.5,
                max_tokens=700
            )
            response_text = response.choices[0].message.content.strip()

            # Attempt to parse the response as JSON
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError as json_error:
                return jsonify({
                    "error": f"JSON decode error: {str(json_error)}",
                    "raw_response": response_text
                }), 500

            # Ensure keys exist in the result
            summary = result.get("summary", "")
            key_points = result.get("key_points", [])
            action_items = result.get("action_items", [])

            return jsonify({
                "summary": summary,
                "key_points": key_points,
                "action_items": action_items
            })

        except Exception as api_error:
            # fallback dummy response if OpenAI fails (e.g., quota error)
            print("OpenAI API error:", api_error)
            return jsonify({
                "summary": "Simulasi ringkasan dari transcript.",
                "key_points": [
                    "Strategi promosi diprioritaskan ke media sosial.",
                    "Kolaborasi dengan influencer lokal.",
                    "Anggaran promosi akan ditingkatkan 20%."
                ],
                "action_items": [
                    "Riset tren promosi terbaru",
                    "Hubungi tim desain untuk materi konten"
                ],
                "debug": f"{str(api_error)}"
            }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500