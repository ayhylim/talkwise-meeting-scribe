
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Upload, Play, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  onTranscriptReady: (transcript: string) => void;
  onProcessingStart: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscriptReady,
  onProcessingStart,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'id-ID'; // Set to Indonesian, can be made configurable
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        const fullTranscript = transcript + finalTranscript + interimTranscript;
        setTranscript(fullTranscript);
        onTranscriptReady(fullTranscript);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Error",
          description: "Terjadi kesalahan dalam speech recognition",
          variant: "destructive",
        });
      };
      
      setRecognition(recognitionInstance);
    }
  }, [transcript, onTranscriptReady, toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start audio recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      onProcessingStart();
      
      // Start speech recognition
      if (recognition) {
        recognition.start();
      }
      
      toast({
        title: "Recording Started",
        description: "Mulai berbicara untuk transcription real-time",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Tidak dapat mengakses microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (recognition) {
      recognition.stop();
    }
    
    // Save transcript to localStorage
    if (transcript) {
      const transcriptRecord = {
        id: Date.now().toString(),
        title: `Meeting ${new Date().toLocaleDateString()}`,
        transcript: transcript,
        summary: '',
        createdAt: new Date(),
        duration: '00:00:00' // This would be calculated in a real app
      };
      
      const existingTranscripts = JSON.parse(localStorage.getItem('talkwise-transcripts') || '[]');
      existingTranscripts.unshift(transcriptRecord);
      localStorage.setItem('talkwise-transcripts', JSON.stringify(existingTranscripts));
    }
    
    toast({
      title: "Recording Stopped",
      description: "Audio berhasil direkam dan transcript selesai",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      onProcessingStart();
      
      // Simulate transcription process for uploaded file
      setTimeout(() => {
        const mockTranscript = "Ini adalah contoh transcript dari file audio yang diupload. Dalam implementasi nyata, file audio akan diproses melalui middleware untuk noise reduction dan kemudian dikirim ke API transcription yang lebih canggih seperti Whisper OpenAI atau Google Speech-to-Text.";
        setTranscript(mockTranscript);
        onTranscriptReady(mockTranscript);
        
        toast({
          title: "File Processed",
          description: "Audio file berhasil diproses dan transcript siap",
        });
      }, 2000);
    }
  };

  const playAudio = () => {
    if (audioBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-4">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'gradient-primary'
            }`}
          >
            {isRecording ? (
              <Square className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </Button>
        </div>
        
        <p className="text-sm text-slate-600">
          {isRecording ? 'Recording... Klik untuk stop' : 'Klik untuk mulai recording'}
        </p>
      </div>

      {/* File Upload */}
      <Card className="p-4 border-dashed border-2 border-slate-300">
        <div className="text-center">
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <Label htmlFor="audio-upload" className="cursor-pointer">
            <span className="text-lg font-medium text-slate-700">
              Upload Audio File
            </span>
            <p className="text-sm text-slate-500 mt-1">
              Support: MP3, WAV, M4A (Max 100MB)
            </p>
          </Label>
          <Input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </Card>

      {/* Audio Playback */}
      {audioBlob && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recorded Audio</span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={isPlaying ? pauseAudio : playAudio}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <audio ref={audioRef} className="hidden" />
        </Card>
      )}

      {/* Processing Status */}
      {isRecording && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <div>
              <p className="font-medium text-blue-800">Processing Audio...</p>
              <p className="text-sm text-blue-600">
                AI sedang memproses audio melalui middleware untuk hasil terbaik
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AudioRecorder;
