import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Upload, Play, Pause, Square, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TypeScript declarations for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
  const [recognition, setRecognition] = useState<any>(null);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("id-ID");
  const [isListening, setIsListening] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Language options for better multi-language support
  const languages = [
    { code: "id-ID", name: "Bahasa Indonesia" },
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "es-ES", name: "Español" },
    { code: "fr-FR", name: "Français" },
    { code: "de-DE", name: "Deutsch" },
    { code: "ja-JP", name: "日本語" },
    { code: "ko-KR", name: "한국어" },
    { code: "zh-CN", name: "中文 (简体)" },
    { code: "ar-SA", name: "العربية" },
    { code: "hi-IN", name: "हिन्दी" },
    { code: "pt-BR", name: "Português (Brasil)" },
    { code: "ru-RU", name: "Русский" },
    { code: "it-IT", name: "Italiano" },
    { code: "nl-NL", name: "Nederlands" },
  ];

  // Optimized Speech Recognition setup with better error handling and restart mechanism
  const setupSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition tidak didukung di browser ini",
        variant: "destructive",
      });
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    // Enhanced configuration for better accuracy and lower latency
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = selectedLanguage;
    recognitionInstance.maxAlternatives = 3; // Get multiple alternatives for better accuracy
    
    // Faster response settings
    if ('webkitSpeechRecognition' in window) {
      recognitionInstance.webkitServiceType = 'dictation'; // Better for continuous speech
    }
    
    recognitionInstance.onstart = () => {
      setIsListening(true);
      console.log("Speech recognition started");
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      console.log("Speech recognition ended");
      
      // Auto-restart if still recording to maintain continuous recognition
      if (isRecording) {
        setTimeout(() => {
          try {
            recognitionInstance.start();
          } catch (error) {
            console.log("Recognition restart failed:", error);
          }
        }, 100);
      }
    };
    
    recognitionInstance.onresult = (event: any) => {
      let newInterimTranscript = '';
      let newFinalTranscript = finalTranscript;
      
      // Process results with improved accuracy
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        
        if (result.isFinal) {
          newFinalTranscript += text + ' ';
          setFinalTranscript(newFinalTranscript);
        } else {
          newInterimTranscript += text;
        }
      }
      
      setInterimTranscript(newInterimTranscript);
      
      // Combine final and interim for live display
      const fullTranscript = newFinalTranscript + newInterimTranscript;
      setTranscript(fullTranscript);
      onTranscriptReady(fullTranscript);
      
      // Clear timeout for smoother experience
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
    
    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific errors without showing toast for common issues
      if (event.error === 'network') {
        // Silently try to restart
        setTimeout(() => {
          if (isRecording) {
            try {
              recognitionInstance.start();
            } catch (error) {
              console.log("Network error restart failed");
            }
          }
        }, 1000);
      } else if (event.error === 'aborted') {
        // Normal when stopping, don't show error
        return;
      } else if (event.error === 'no-speech') {
        // Just restart, no error needed
        setTimeout(() => {
          if (isRecording) {
            try {
              recognitionInstance.start();
            } catch (error) {
              console.log("No speech restart failed");
            }
          }
        }, 500);
      } else {
        toast({
          title: "Recognition Error",
          description: `Error: ${event.error}`,
          variant: "destructive",
        });
      }
    };
    
    return recognitionInstance;
  }, [selectedLanguage, isRecording, finalTranscript, onTranscriptReady, toast]);

  useEffect(() => {
    const recognitionInstance = setupSpeechRecognition();
    setRecognition(recognitionInstance);
    
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
  }, [setupSpeechRecognition]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Start audio recording
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start(100); // Record in 100ms chunks for lower latency
      setIsRecording(true);
      onProcessingStart();
      
      // Reset transcripts
      setFinalTranscript("");
      setInterimTranscript("");
      setTranscript("");
      
      // Start speech recognition with retry mechanism
      if (recognition) {
        try {
          recognition.start();
        } catch (error) {
          console.log("Recognition start error:", error);
          setTimeout(() => {
            try {
              recognition.start();
            } catch (retryError) {
              console.log("Recognition retry failed:", retryError);
            }
          }, 500);
        }
      }
      
      toast({
        title: "Recording Started",
        description: `Mulai berbicara dalam ${languages.find(l => l.code === selectedLanguage)?.name}`,
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
    
    setIsListening(false);
    
    // Save transcript to localStorage with final version
    if (finalTranscript.trim()) {
      const transcriptRecord = {
        id: Date.now().toString(),
        title: `Meeting ${new Date().toLocaleDateString()}`,
        transcript: finalTranscript.trim(),
        summary: '',
        createdAt: new Date(),
        duration: '00:00:00',
        language: selectedLanguage
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
      {/* Language Selection */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <Settings className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <Label htmlFor="language-select" className="text-sm font-medium">
              Bahasa Recognition
            </Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Pilih bahasa" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

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
        
        <div className="text-center">
          <p className="text-sm text-slate-600">
            {isRecording ? 'Recording... Klik untuk stop' : 'Klik untuk mulai recording'}
          </p>
          {isListening && (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">AI sedang mendengarkan...</span>
            </div>
          )}
        </div>
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

      {/* Live Transcript Preview */}
      {(finalTranscript || interimTranscript) && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">Live Transcript</span>
            </div>
            <div className="text-sm text-blue-700">
              <span className="font-medium">{finalTranscript}</span>
              <span className="text-blue-500 italic">{interimTranscript}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Processing Status */}
      {isRecording && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <div>
              <p className="font-medium text-green-800">Processing Audio...</p>
              <p className="text-sm text-green-600">
                AI sedang memproses audio real-time dengan teknologi advanced
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AudioRecorder;
