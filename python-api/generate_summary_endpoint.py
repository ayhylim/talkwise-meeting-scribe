from flask import request, jsonify
import os
import openai

openai.api_key = os.getenv("OPEN_AI_API_KEY")

def generate_summary():
    try:
        data = request.get_json()
        transcript = data.get('transcript', '').strip()
        if not transcript:
            return jsonify({"error": "Transcript is required"}), 400

        prompt = f"""
        You are an AI assistant that summarizes meeting transcripts.
        Given the following transcript, provide:
        1. A detailed summary with explanation.
        2. Bullet points summarizing key points.
        3. Key action items if any.

        Transcript:
        {transcript}

        Summary:
        """

        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=500,
            temperature=0.5,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )

        summary_text = response.choices[0].text.strip()

        return jsonify({
            "summary": summary_text,
            "key_points": [],
            "action_items": []
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
