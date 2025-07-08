# live_transcript_manager.py
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
import threading
import time

@dataclass
class TranscriptChunk:
    text: str
    timestamp: datetime
    speaker: Optional[str] = None
    confidence: float = 0.0

class LiveTranscriptManager:
    def __init__(self, summary_interval: int = 300):  # 5 minutes
        self.transcript_chunks: List[TranscriptChunk] = []
        self.current_summary = None
        self.summary_interval = summary_interval  # seconds
        self.last_summary_time = datetime.now()
        self.lock = threading.Lock()
        self.auto_summary_enabled = True
        self.topic_keywords = []
        
    def add_transcript_chunk(self, text: str, speaker: str = None, confidence: float = 0.0):
        """Add new transcript chunk"""
        with self.lock:
            chunk = TranscriptChunk(
                text=text.strip(),
                timestamp=datetime.now(),
                speaker=speaker,
                confidence=confidence
            )
            self.transcript_chunks.append(chunk)
            
            # Check if we need to auto-generate summary
            if self.should_auto_generate_summary():
                return self.generate_live_summary()
            
            return None
    
    def should_auto_generate_summary(self) -> bool:
        """Check if it's time to generate a new summary"""
        if not self.auto_summary_enabled:
            return False
            
        time_since_last = (datetime.now() - self.last_summary_time).total_seconds()
        return time_since_last >= self.summary_interval
    
    def get_recent_transcript(self, minutes: int = 10) -> str:
        """Get transcript from last N minutes"""
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        
        with self.lock:
            recent_chunks = [
                chunk for chunk in self.transcript_chunks 
                if chunk.timestamp >= cutoff_time
            ]
            
            return " ".join([chunk.text for chunk in recent_chunks])
    
    def get_full_transcript(self) -> str:
        """Get complete transcript"""
        with self.lock:
            return " ".join([chunk.text for chunk in self.transcript_chunks])
    
    def generate_live_summary(self) -> Dict:
        """Generate summary from current transcript"""
        transcript_text = self.get_full_transcript()
        
        if len(transcript_text.strip()) < 50:  # Too short to summarize
            return None
            
        # This will be called by the endpoint
        self.last_summary_time = datetime.now()
        
        return {
            "transcript": transcript_text,
            "chunk_count": len(self.transcript_chunks),
            "duration_minutes": self._get_session_duration(),
            "last_updated": datetime.now().isoformat()
        }
    
    def _get_session_duration(self) -> float:
        """Get total session duration in minutes"""
        if not self.transcript_chunks:
            return 0
            
        first_chunk = self.transcript_chunks[0]
        last_chunk = self.transcript_chunks[-1]
        
        duration = last_chunk.timestamp - first_chunk.timestamp
        return duration.total_seconds() / 60
    
    def clear_transcript(self):
        """Clear all transcript data"""
        with self.lock:
            self.transcript_chunks.clear()
            self.current_summary = None
            self.last_summary_time = datetime.now()
    
    def get_transcript_stats(self) -> Dict:
        """Get statistics about current transcript"""
        with self.lock:
            total_words = sum(len(chunk.text.split()) for chunk in self.transcript_chunks)
            speakers = set(chunk.speaker for chunk in self.transcript_chunks if chunk.speaker)
            
            return {
                "total_chunks": len(self.transcript_chunks),
                "total_words": total_words,
                "unique_speakers": len(speakers),
                "speakers": list(speakers),
                "session_duration_minutes": self._get_session_duration(),
                "average_confidence": sum(chunk.confidence for chunk in self.transcript_chunks) / len(self.transcript_chunks) if self.transcript_chunks else 0
            }

# Enhanced generate_summary_endpoint.py
from flask import request, jsonify
import os
import json
import os
import json
import requests
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Global transcript manager
transcript_manager = LiveTranscriptManager()

from dotenv import load_dotenv
import os
import json
from datetime import datetime
from gemini import GeminiClient  # Hypothetical Gemini AI client import
from flask import request, jsonify

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize Gemini client with API key only
gemini_client = GeminiClient(api_key=GEMINI_API_KEY)

def generate_summary():
    try:
        data = request.get_json()
        transcript = data.get('transcript', '').strip()

        # Option 1: Use provided transcript
        if transcript:
            pass
        # Option 2: Use live transcript manager
        elif data.get('use_live_transcript', False):
            transcript = transcript_manager.get_full_transcript()
        # Option 3: Get recent transcript only
        elif data.get('recent_minutes'):
            minutes = int(data.get('recent_minutes', 10))
            transcript = transcript_manager.get_recent_transcript(minutes)

        if not transcript:
            return jsonify({"error": "No transcript available"}), 400

        # Prepare prompt for Gemini AI
        meeting_context = data.get('meeting_context', {})
        attendees = meeting_context.get('attendees', [])
        meeting_type = meeting_context.get('type', 'general')

        context_info = ""
        if attendees:
            context_info += f"Meeting attendees: {', '.join(attendees)}\n"
        if meeting_type != 'general':
            context_info += f"Meeting type: {meeting_type}\n"

        prompt = f"""{context_info}
Analyze the following meeting transcript and provide a JSON response with these fields:
- title: A concise and descriptive title for the meeting summary
- summary: A comprehensive summary (2-3 paragraphs)
- key_points: List of main discussion points
- decisions_made: List of decisions reached
- action_items: List of action items with details
- questions_raised: Important questions that were discussed
- next_steps: Immediate next steps
- participants_mentioned: Names mentioned in the conversation

Meeting Transcript:
{transcript}

Respond ONLY with valid JSON.
"""

        # Call Gemini AI client chat completion
        response = gemini_client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=[
                {"role": "system", "content": "You are an expert meeting summarizer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )

        response_text = response.choices[0].message.content.strip()

        try:
            result = json.loads(response_text)
        except json.JSONDecodeError as json_error:
            # Try to fix common JSON issues
            response_text = response_text.replace('\n', ' ').replace('\r', '')
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                return jsonify({
                    "error": f"JSON decode error: {str(json_error)}",
                    "raw_response": response_text
                }), 500

        # Ensure all expected fields exist
        summary_data = {
            "title": result.get("title", ""),
            "summary": result.get("summary", ""),
            "key_points": result.get("key_points", []),
            "decisions_made": result.get("decisions_made", []),
            "action_items": result.get("action_items", []),
            "questions_raised": result.get("questions_raised", []),
            "next_steps": result.get("next_steps", []),
            "participants_mentioned": result.get("participants_mentioned", []),
            "generated_at": datetime.now().isoformat(),
            "transcript_stats": transcript_manager.get_transcript_stats()
        }

        return jsonify(summary_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# New endpoints for live transcript management
def add_transcript_chunk():
    """Add new transcript chunk"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        speaker = data.get('speaker')
        confidence = data.get('confidence', 0.0)
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
            
        # Add to transcript manager
        auto_summary = transcript_manager.add_transcript_chunk(text, speaker, confidence)
        
        response = {
            "success": True,
            "chunk_added": True,
            "stats": transcript_manager.get_transcript_stats()
        }
        
        # If auto-summary was triggered
        if auto_summary:
            response["auto_summary_triggered"] = True
            response["summary_data"] = auto_summary
            
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_live_transcript():
    """Get current live transcript"""
    try:
        minutes = request.args.get('recent_minutes', type=int)
        
        if minutes:
            transcript = transcript_manager.get_recent_transcript(minutes)
        else:
            transcript = transcript_manager.get_full_transcript()
            
        return jsonify({
            "transcript": transcript,
            "stats": transcript_manager.get_transcript_stats()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def clear_transcript():
    """Clear current transcript"""
    try:
        transcript_manager.clear_transcript()
        return jsonify({"success": True, "message": "Transcript cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_transcript_stats():
    """Get transcript statistics"""
    try:
        return jsonify(transcript_manager.get_transcript_stats())
    except Exception as e:
        return jsonify({"error": str(e)}), 500