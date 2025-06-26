from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import librosa
import noisereduce as nr
import soundfile as sf
import io
import base64
import tempfile
import os
from scipy.signal import butter, filtfilt, savgol_filter
from scipy.ndimage import median_filter
import threading
import time

app = Flask(__name__)   
CORS(app)  # Enable CORS for React frontend

class NoiseReducer:
    def __init__(self):
        self.sample_rate = 16000  # Standard sample rate for speech
        
    def butter_bandpass_filter(self, data, lowcut=80, highcut=8000, fs=16000, order=5):
        """Apply bandpass filter to remove frequencies outside speech range"""
        nyquist = 0.5 * fs
        low = lowcut / nyquist
        high = highcut / nyquist
        b, a = butter(order, [low, high], btype='band')
        return filtfilt(b, a, data)
    
    def spectral_gating(self, audio, sr, alpha=2.0, beta=0.15):
        """Advanced spectral gating for noise reduction"""
        # Convert to frequency domain
        stft = librosa.stft(audio, hop_length=512, win_length=2048)
        magnitude = np.abs(stft)
        phase = np.angle(stft)
        
        # Estimate noise floor
        noise_floor = np.percentile(magnitude, 20, axis=1, keepdims=True)
        
        # Create spectral gate
        gate = np.where(
            magnitude > alpha * noise_floor,
            1.0,
            beta * (magnitude / (alpha * noise_floor))
        )
        
        # Apply gate
        gated_stft = magnitude * gate * np.exp(1j * phase)
        
        # Convert back to time domain
        return librosa.istft(gated_stft, hop_length=512, win_length=2048)
    
    def adaptive_wiener_filter(self, audio, sr, frame_length=2048, hop_length=512):
        """Adaptive Wiener filtering for dynamic noise reduction"""
        stft = librosa.stft(audio, hop_length=hop_length, win_length=frame_length)
        magnitude = np.abs(stft)
        phase = np.angle(stft)
        
        # Estimate noise spectrum from first 0.5 seconds
        noise_frames = int(0.5 * sr / hop_length)
        noise_spectrum = np.mean(magnitude[:, :noise_frames], axis=1, keepdims=True)
        
        # Calculate SNR
        snr = magnitude / (noise_spectrum + 1e-10)
        
        # Wiener filter
        wiener_gain = snr / (snr + 1)
        
        # Apply smoothing to gain
        wiener_gain = savgol_filter(wiener_gain, window_length=5, polyorder=2, axis=1)
        
        # Apply filter
        filtered_stft = magnitude * wiener_gain * np.exp(1j * phase)
        
        return librosa.istft(filtered_stft, hop_length=hop_length, win_length=frame_length)
    
    def multi_band_compressor(self, audio, sr, bands=4, ratios=[4, 6, 8, 10], 
                             thresholds=[-20, -15, -10, -5]):
        """Multi-band compression for dynamic range control"""
        # Split into frequency bands
        freqs = np.logspace(np.log10(80), np.log10(sr//2), bands+1)
        
        compressed_bands = []
        for i in range(bands):
            # Filter band
            if i == 0:
                # Low-pass for first band
                band = self.butter_lowpass_filter(audio, freqs[i+1], sr)
            elif i == bands-1:
                # High-pass for last band
                band = self.butter_highpass_filter(audio, freqs[i], sr)
            else:
                # Band-pass for middle bands
                band = self.butter_bandpass_filter(audio, freqs[i], freqs[i+1], sr)
            
            # Apply compression
            compressed_band = self.compress_audio(band, threshold=thresholds[i], 
                                                 ratio=ratios[i])
            compressed_bands.append(compressed_band)
        
        # Sum all bands
        return np.sum(compressed_bands, axis=0)
    
    def butter_lowpass_filter(self, data, cutoff, fs, order=5):
        nyquist = 0.5 * fs
        normal_cutoff = cutoff / nyquist
        b, a = butter(order, normal_cutoff, btype='low', analog=False)
        return filtfilt(b, a, data)
    
    def butter_highpass_filter(self, data, cutoff, fs, order=5):
        nyquist = 0.5 * fs
        normal_cutoff = cutoff / nyquist
        b, a = butter(order, normal_cutoff, btype='high', analog=False)
        return filtfilt(b, a, data)
    
    def compress_audio(self, audio, threshold=-20, ratio=4, attack=0.003, release=0.1):
        """Audio compressor"""
        # Convert threshold from dB to linear
        threshold_linear = 10 ** (threshold / 20)
        
        # Calculate envelope
        envelope = np.abs(audio)
        
        # Apply compression
        compressed = np.where(
            envelope > threshold_linear,
            threshold_linear + (envelope - threshold_linear) / ratio,
            envelope
        )
        
        # Maintain original sign
        return compressed * np.sign(audio)
    
    def enhance_speech(self, audio, sr):
        """Comprehensive speech enhancement pipeline"""
        # 1. Normalize input
        audio = audio / (np.max(np.abs(audio)) + 1e-10)
        
        # 2. Pre-emphasis filter
        pre_emphasis = 0.97
        audio = np.append(audio[0], audio[1:] - pre_emphasis * audio[:-1])
        
        # 3. Bandpass filter for speech frequencies
        audio = self.butter_bandpass_filter(audio, lowcut=80, highcut=8000, fs=sr)
        
        # 4. Advanced noise reduction using noisereduce library
        audio = nr.reduce_noise(y=audio, sr=sr, prop_decrease=0.8, stationary=False)
        
        # 5. Spectral gating
        audio = self.spectral_gating(audio, sr, alpha=2.5, beta=0.1)
        
        # 6. Adaptive Wiener filtering
        audio = self.adaptive_wiener_filter(audio, sr)
        
        # 7. Multi-band compression
        audio = self.multi_band_compressor(audio, sr)
        
        # 8. Final normalization and limiting
        audio = self.normalize_and_limit(audio)
        
        return audio
    
    def normalize_and_limit(self, audio, target_lufs=-23):
        """Normalize audio to target LUFS and apply limiting"""
        # Simple normalization to prevent clipping
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio / peak * 0.95
        
        # Simple limiter
        audio = np.tanh(audio)
        
        return audio
    
    def real_time_denoise(self, audio_chunk, sr):
        """Optimized real-time denoising for streaming audio"""
        # Quick and efficient denoising for real-time processing
        
        # 1. Bandpass filter
        filtered = self.butter_bandpass_filter(audio_chunk, lowcut=100, highcut=7000, fs=sr)
        
        # 2. Simple spectral subtraction
        stft = librosa.stft(filtered, hop_length=256, win_length=1024)
        magnitude = np.abs(stft)
        phase = np.angle(stft)
        
        # Estimate noise (use first 10% of frames)
        noise_frames = max(1, magnitude.shape[1] // 10)
        noise_spectrum = np.mean(magnitude[:, :noise_frames], axis=1, keepdims=True)
        
        # Spectral subtraction
        alpha = 2.0
        beta = 0.01
        enhanced_magnitude = np.maximum(
            magnitude - alpha * noise_spectrum,
            beta * magnitude
        )
        
        # Reconstruct
        enhanced_stft = enhanced_magnitude * np.exp(1j * phase)
        enhanced_audio = librosa.istft(enhanced_stft, hop_length=256, win_length=1024)
        
        # 3. Simple compression
        enhanced_audio = np.tanh(enhanced_audio * 2) * 0.8
        
        return enhanced_audio

# Initialize noise reducer
noise_reducer = NoiseReducer()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Noise cancellation API is running"})

@app.route('/process-audio', methods=['POST'])
def process_audio():
    try:
        data = request.get_json()
        
        if not data or 'audio_data' not in data:
            return jsonify({"error": "No audio data provided"}), 400
        
        # Decode base64 audio data
        audio_data = base64.b64decode(data['audio_data'])
        
        # Get processing parameters
        mode = data.get('mode', 'full')  # 'full' or 'realtime'
        sample_rate = data.get('sample_rate', 16000)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            tmp_file.write(audio_data)
            tmp_file_path = tmp_file.name
        
        try:
            # Load audio
            audio, sr = librosa.load(tmp_file_path, sr=sample_rate)
            
            # Process based on mode
            if mode == 'realtime':
                processed_audio = noise_reducer.real_time_denoise(audio, sr)
            else:
                processed_audio = noise_reducer.enhance_speech(audio, sr)
            
            # Create output file
            output_buffer = io.BytesIO()
            sf.write(output_buffer, processed_audio, sr, format='WAV')
            output_buffer.seek(0)
            
            # Encode to base64
            processed_audio_b64 = base64.b64encode(output_buffer.read()).decode('utf-8')
            
            return jsonify({
                "success": True,
                "processed_audio": processed_audio_b64,
                "sample_rate": sr,
                "duration": len(processed_audio) / sr,
                "processing_mode": mode
            })
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/process-stream', methods=['POST'])
def process_audio_stream():
    """Process audio in real-time streaming mode"""
    try:
        data = request.get_json()
        
        if not data or 'audio_chunk' not in data:
            return jsonify({"error": "No audio chunk provided"}), 400
        
        # Decode audio chunk
        audio_chunk_data = base64.b64decode(data['audio_chunk'])
        sample_rate = data.get('sample_rate', 16000)
        
        # Create temporary file for chunk
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            tmp_file.write(audio_chunk_data)
            tmp_file_path = tmp_file.name
        
        try:
            # Load audio chunk
            audio_chunk, sr = librosa.load(tmp_file_path, sr=sample_rate)
            
            # Process with real-time optimized algorithm
            processed_chunk = noise_reducer.real_time_denoise(audio_chunk, sr)
            
            # Encode processed chunk
            output_buffer = io.BytesIO()
            sf.write(output_buffer, processed_chunk, sr, format='WAV')
            output_buffer.seek(0)
            
            processed_chunk_b64 = base64.b64encode(output_buffer.read()).decode('utf-8')
            
            return jsonify({
                "success": True,
                "processed_chunk": processed_chunk_b64,
                "chunk_duration": len(processed_chunk) / sr
            })
            
        finally:
            os.unlink(tmp_file_path)
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-settings', methods=['GET'])
def get_noise_reduction_settings():
    """Get available noise reduction settings"""
    return jsonify({
        "modes": [
            {
                "id": "realtime",
                "name": "Real-time",
                "description": "Optimized for live audio with minimal latency"
            },
            {
                "id": "full",
                "name": "Full Enhancement",
                "description": "Complete noise reduction and speech enhancement"
            }
        ],
        "sample_rates": [16000, 22050, 44100, 48000],
        "default_settings": {
            "mode": "realtime",
            "sample_rate": 16000,
            "chunk_size": 1024
        }
    })

if __name__ == '__main__':
    print("Starting Noise Cancellation API Server...")
    print("Available endpoints:")
    print("- GET /health - Health check")
    print("- POST /process-audio - Process complete audio file")
    print("- POST /process-stream - Process audio stream chunks")
    print("- GET /get-settings - Get available settings")
    
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
    print("Server is running...")