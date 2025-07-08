import React, {useState, useRef, useEffect, useCallback, ChangeEvent} from "react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Upload, Play, Pause, Square, Settings, Users} from "lucide-react";
import {useToast} from "@/hooks/use-toast";

// Add global declarations for SpeechRecognition types to fix TS errors
declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}

type SpeechRecognition = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onstart: () => void;
    onend: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    start: () => void;
    stop: () => void;
};

interface SpeechRecognitionEvent {
    resultIndex: number;
    results: Array<{
        isFinal: boolean;
        0: {transcript: string};
    }>;
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

interface AudioRecorderProps {
    onTranscriptReady: (transcript: string) => void;
    onProcessingStart: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({onTranscriptReady, onProcessingStart}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [permanentTranscript, setPermanentTranscript] = useState("");
    const permanentTranscriptRef = useRef("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("id-ID");
    const [isListening, setIsListening] = useState(false);

    // New state for audio input devices and selected deviceId
    const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

    // New states for gain and audio constraints
    const [gainValue, setGainValue] = useState(1.5);
    const [echoCancellation, setEchoCancellation] = useState(true);
    const [noiseSuppression, setNoiseSuppression] = useState(true);
    const [autoGainControl, setAutoGainControl] = useState(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const isRecordingRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const {toast} = useToast();

    // Language options
    const languages = [
        {code: "id-ID", name: "Bahasa Indonesia"},
        {code: "en-US", name: "English (US)"},
        {code: "en-GB", name: "English (UK)"},
        {code: "es-ES", name: "Español"},
        {code: "fr-FR", name: "Français"},
        {code: "de-DE", name: "Deutsch"},
        {code: "ja-JP", name: "日本語"},
        {code: "ko-KR", name: "한국어"},
        {code: "zh-CN", name: "中文 (简体)"},
        {code: "ar-SA", name: "العربية"},
        {code: "hi-IN", name: "हिन्दी"},
        {code: "pt-BR", name: "Português (Brasil)"},
        {code: "ru-RU", name: "Русский"},
        {code: "it-IT", name: "Italiano"},
        {code: "nl-NL", name: "Nederlands"}
    ];

    // Enhanced Speech Recognition setup dengan audio routing yang lebih baik
    const setupSpeechRecognition = useCallback(() => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            toast({
                title: "Browser Not Supported",
                description: "Speech recognition tidak didukung di browser ini",
                variant: "destructive"
            });
            return null;
        }

        // Cast to any to avoid TS errors
        const SpeechRecognitionClass: any = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognitionClass();

        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = selectedLanguage;
        recognitionInstance.maxAlternatives = 1;

        if ("webkitSpeechRecognition" in window) {
            // Removed @ts-expect-error, kept comment for clarity
            // recognitionInstance.webkitServiceType = 'search';
        }

        recognitionInstance.onstart = () => {
            console.log("Speech recognition started successfully");
            setIsListening(true);
        };

        recognitionInstance.onend = () => {
            console.log("Speech recognition ended");
            setIsListening(false);

            // Don't restart if it's stopped
            if (isRecordingRef.current && !isStoppingRef.current) {
                console.log("Restarting recognition...");

                setTimeout(() => {
                    if (isRecordingRef.current) {
                        try {
                            recognitionInstance.start();
                        } catch (error) {
                            console.log("Failed to restart recognition:", error);
                            // Retry with exponential backoff
                            let retryDelay = 500;
                            const maxRetries = 5;
                            let retries = 0;
                            const retryStart = () => {
                                if (retries < maxRetries && isRecordingRef.current) {
                                    try {
                                        recognitionInstance.start();
                                        console.log("Speech recognition restarted successfully");
                                    } catch (err) {
                                        retries++;
                                        retryDelay *= 2;
                                        console.log(`Retry ${retries} failed, retrying in ${retryDelay}ms`);
                                        setTimeout(retryStart, retryDelay);
                                    }
                                } else if (retries >= maxRetries) {
                                    toast({
                                        title: "Speech Recognition Error",
                                        description:
                                            "Gagal memulai ulang speech recognition setelah beberapa kali percobaan.",
                                        variant: "destructive"
                                    });
                                }
                            };
                            retryStart();
                        }
                    }
                }, 100);
            }
        };

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
            console.log("Recognition result received:", event.results.length);

            let newInterimTranscript = "";
            let newFinalText = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;

                if (result.isFinal) {
                    console.log("Final result:", text);
                    newFinalText += text + " ";
                } else {
                    console.log("Interim result:", text);
                    newInterimTranscript += text;
                }
            }

            if (newFinalText) {
                const updatedPermanent = permanentTranscriptRef.current + newFinalText;
                permanentTranscriptRef.current = updatedPermanent;
                setPermanentTranscript(updatedPermanent);
                console.log("Updated permanent transcript:", updatedPermanent);
            }

            setInterimTranscript(newInterimTranscript);

            const fullTranscript = permanentTranscriptRef.current + newFinalText + newInterimTranscript;
            console.log("Sending transcript update:", fullTranscript);
            onTranscriptReady(fullTranscript);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error);

            if (event.error === "not-allowed") {
                toast({
                    title: "Microphone Access Denied",
                    description: "Mohon izinkan akses microphone untuk menggunakan fitur ini",
                    variant: "destructive"
                });
                setIsRecording(false);
                isRecordingRef.current = false;
            } else if (event.error === "network") {
                console.log("Network error, will retry...");
            } else if (event.error === "no-speech") {
                console.log("No speech detected, continuing...");
            } else if (event.error === "aborted") {
                console.log("Recognition aborted normally");
            } else {
                toast({
                    title: "Speech Recognition Error",
                    description: `Error: ${event.error}`,
                    variant: "destructive"
                });
            }
        };

        return recognitionInstance;
    }, [selectedLanguage, permanentTranscript, onTranscriptReady, toast]);

    useEffect(() => {
        const recognitionInstance = setupSpeechRecognition();
        setRecognition(recognitionInstance);

        return () => {
            if (recognitionInstance) {
                recognitionInstance.stop();
            }
        };
    }, [setupSpeechRecognition]);

    // New effect to enumerate audio input devices and listen for device changes
    useEffect(() => {
        const updateAudioInputDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(device => device.kind === "audioinput");
                setAudioInputDevices(audioInputs);
                if (!selectedDeviceId && audioInputs.length > 0) {
                    setSelectedDeviceId(audioInputs[0].deviceId);
                }
            } catch (error) {
                console.error("Error enumerating devices:", error);
            }
        };

        updateAudioInputDevices();

        const handleDeviceChange = async () => {
            await updateAudioInputDevices();
            setTimeout(() => {
                setAudioInputDevices(currentDevices => {
                    if (selectedDeviceId) {
                        const deviceStillAvailable = currentDevices.some(
                            device => device.deviceId === selectedDeviceId
                        );
                        if (!deviceStillAvailable && currentDevices.length > 0) {
                            setSelectedDeviceId(currentDevices[0].deviceId);
                            toast({
                                title: "Audio Device Changed",
                                description: "Perangkat audio input berubah, menggunakan perangkat baru."
                            });
                        }
                    }
                    return currentDevices;
                });
            }, 500);
        };

        navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
        };
    }, [selectedDeviceId, toast]);

    const createMixedAudioStream = async (): Promise<MediaStream> => {
        try {
            audioContextRef.current = new AudioContext();
            const audioContext = audioContextRef.current;

            // Create gain node for microphone to increase sensitivity
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 1.5; // Increase gain by 1.5x, adjust as needed

            destinationRef.current = audioContext.createMediaStreamDestination();
            const destination = destinationRef.current;

            console.log("Attempting to get microphone stream...");

            let microphoneStream: MediaStream;
            try {
                microphoneStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: selectedDeviceId ? {exact: selectedDeviceId} : undefined,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000
                    }
                });
                console.log("Microphone stream obtained successfully");

                const micSource = audioContext.createMediaStreamSource(microphoneStream);
                micSource.connect(gainNode);
                gainNode.connect(destination);
            } catch (micError) {
                console.warn("Microphone access failed:", micError);
                toast({
                    title: "Microphone Warning",
                    description: "Tidak dapat mengakses microphone, akan mencoba hanya system audio",
                    variant: "destructive"
                });
            }

            console.log("Attempting to get system audio stream...");
            try {
                const systemStream = await navigator.mediaDevices.getDisplayMedia({
                    video: false,
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        sampleRate: 48000,
                        channelCount: 2
                    }
                });

                console.log("System audio stream obtained successfully");

                const systemSource = audioContext.createMediaStreamSource(systemStream);
                systemSource.connect(destination);

                systemStream.getVideoTracks().forEach(track => track.stop());
                systemStream.getAudioTracks().forEach(track => {
                    track.addEventListener("ended", () => {
                        console.log("System audio track ended");
                    });
                });
            } catch (systemError) {
                console.warn("System audio access failed:", systemError);
                toast({
                    title: "System Audio Warning",
                    description: "Tidak dapat mengakses system audio, akan menggunakan microphone saja"
                });
            }

            const mixedStream = destination.stream;
            console.log("Mixed audio stream created with tracks:", mixedStream.getTracks().length);

            return mixedStream;
        } catch (error) {
            console.error("Error creating mixed audio stream:", error);

            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                console.log("Using fallback microphone stream");
                return fallbackStream;
            } catch (fallbackError) {
                console.error("Complete audio access failed:", fallbackError);
                throw new Error("Tidak dapat mengakses audio source apapun");
            }
        }
    };

    const startRecording = async () => {
        try {
            console.log("Starting mixed audio recording...");

            const mixedStream = await createMixedAudioStream();

            mediaRecorderRef.current = new MediaRecorder(mixedStream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                    ? "audio/webm;codecs=opus"
                    : "audio/webm"
            });
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = event => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, {type: "audio/webm"});
                setAudioBlob(blob);

                mixedStream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
            };

            mediaRecorderRef.current.start(250);
            setIsRecording(true);
            isRecordingRef.current = true;
            onProcessingStart();

            if (recognition) {
                console.log("Starting speech recognition for mixed audio...");
                try {
                    recognition.start();
                } catch (error) {
                    console.log("Speech recognition start error:", error);
                    setTimeout(() => {
                        if (isRecordingRef.current) {
                            try {
                                recognition.start();
                            } catch (retryError) {
                                console.log("Speech recognition retry failed:", retryError);
                            }
                        }
                    }, 500);
                }
            }

            toast({
                title: "Recording Started",
                description: `Mulai capture audio gabungan (microphone + system) dalam ${
                    languages.find(l => l.code === selectedLanguage)?.name
                }`
            });
        } catch (error) {
            console.error("Error starting recording:", error);
            toast({
                title: "Error",
                description: "Tidak dapat mengakses audio. Pastikan browser memiliki permission yang diperlukan.",
                variant: "destructive"
            });
        }
    };

    const isStoppingRef = useRef(false);

    // Stop recording when recording state button clicked
    const stopAllTracks = () => {
        console.log("Stopping all media tracks...");

        // Stop media recorder tracks
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => {
                track.stop();
            });
        }

        // Stop AudioContext
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Stop destination stream if available
        if (destinationRef.current && destinationRef.current.stream) {
            destinationRef.current.stream.getTracks().forEach(track => track.stop());
        }

        // Clear references
        destinationRef.current = null;
    };

    const stopRecording = () => {
        if (isStoppingRef.current) {
            console.log("Already stopping, ignoring duplicate stop call.");
            return;
        }
        console.log("Stopping recording...");
        isStoppingRef.current = true;

        isRecordingRef.current = false;
        setIsRecording(false);

        if (recognition) {
            try {
                recognition.stop();
                console.log("Speech recognition stopped.");
            } catch (error) {
                console.error("Error stopping speech recognition:", error);
            }
        } else {
            console.log("Recognition instance is null or undefined");
        }

        if (mediaRecorderRef.current) {
            console.log("MediaRecorder state before stop:", mediaRecorderRef.current.state);
            try {
                mediaRecorderRef.current.stop();
                console.log("MediaRecorder stopped.");
            } catch (error) {
                console.error("Error stopping MediaRecorder:", error);
            }
        } else {
            console.log("MediaRecorder instance is null or undefined");
        }

        stopAllTracks();
        setIsListening(false);

        if (permanentTranscript.trim()) {
            const transcriptRecord = {
                id: Date.now().toString(),
                title: `Meeting ${new Date().toLocaleDateString()}`,
                transcript: permanentTranscript.trim(),
                summary: "",
                createdAt: new Date(),
                duration: "00:00:00",
                language: selectedLanguage,
                audioSource: "mixed"
            };

            const existingTranscripts = JSON.parse(localStorage.getItem("talkwise-transcripts") || "[]");
            existingTranscripts.unshift(transcriptRecord);
            localStorage.setItem("talkwise-transcripts", JSON.stringify(existingTranscripts));
        }

        toast({
            title: "Recording Stopped",
            description: "Audio berhasil direkam dan transcript selesai"
        });

        // Reset stopping flag after a short delay to allow cleanup
        setTimeout(() => {
            isStoppingRef.current = false;
        }, 1000);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAudioBlob(file);
            onProcessingStart();

            setTimeout(() => {
                const mockTranscript =
                    "Ini adalah contoh transcript dari file audio yang diupload. Dalam implementasi nyata, file audio akan diproses melalui middleware untuk noise reduction dan kemudian dikirim ke API transcription yang lebih canggih seperti Whisper OpenAI atau Google Speech-to-Text.";
                setPermanentTranscript(mockTranscript);
                onTranscriptReady(mockTranscript);

                toast({
                    title: "File Processed",
                    description: "Audio file berhasil diproses dan transcript siap"
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
            {/* Settings Card */}
            <Card className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Audio Settings</span>
                    </div>

                    {/* Language Selection */}
                    <div>
                        <Label htmlFor="language-select" className="text-sm font-medium">
                            Bahasa Recognition
                        </Label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Pilih bahasa" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(lang => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Audio Input Device Selection */}
                    <div>
                        <Label htmlFor="audio-device-select" className="text-sm font-medium">
                            Pilih Perangkat Audio Input
                        </Label>
                        {audioInputDevices.length > 0 && selectedDeviceId && (
                            <Select
                                value={selectedDeviceId}
                                onValueChange={value => setSelectedDeviceId(value)}
                                id="audio-device-select"
                            >
                                <SelectTrigger className="w-full mt-1">
                                    <SelectValue placeholder="Pilih perangkat audio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {audioInputDevices.map(device => (
                                        <SelectItem key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Device ${device.deviceId}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Gain Control */}
                    <div>
                        <Label htmlFor="gain-range" className="text-sm font-medium">
                            Sensitivitas Mikrofon (Gain): {gainValue.toFixed(1)}x
                        </Label>
                        <input
                            type="range"
                            id="gain-range"
                            min="0.5"
                            max="5"
                            step="0.1"
                            value={gainValue}
                            onChange={e => setGainValue(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Audio Constraints Toggles */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="echoCancellation"
                                checked={echoCancellation}
                                onChange={() => setEchoCancellation(!echoCancellation)}
                                className="cursor-pointer"
                            />
                            <Label htmlFor="echoCancellation" className="cursor-pointer text-sm">
                                Echo Cancellation
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="noiseSuppression"
                                checked={noiseSuppression}
                                onChange={() => setNoiseSuppression(!noiseSuppression)}
                                className="cursor-pointer"
                            />
                            <Label htmlFor="noiseSuppression" className="cursor-pointer text-sm">
                                Noise Suppression
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="autoGainControl"
                                checked={autoGainControl}
                                onChange={() => setAutoGainControl(!autoGainControl)}
                                className="cursor-pointer"
                            />
                            <Label htmlFor="autoGainControl" className="cursor-pointer text-sm">
                                Auto Gain Control
                            </Label>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Recording Controls */}
            <div className="flex flex-col items-center space-y-4">
                <div className="flex space-x-4">
                    <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-16 h-16 rounded-full ${
                            isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "gradient-primary"
                        }`}
                    >
                        {isRecording ? (
                            <Square className="h-6 w-6 text-white" />
                        ) : (
                            <Users className="h-6 w-6 text-white" />
                        )}
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-sm text-slate-600">
                        {isRecording
                            ? "Recording audio gabungan (User + System)... Klik untuk stop"
                            : "Klik untuk mulai recording audio gabungan (User + System)"}
                    </p>
                    {isListening && (
                        <div className="flex items-center justify-center space-x-2 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600">AI sedang mendengarkan semua audio...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Mixed Audio Info */}
            <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-green-800">Mixed Audio Capture</h4>
                        <p className="text-sm text-green-700 mt-1">Sistem akan menangkap audio dari:</p>
                        <ul className="text-sm text-green-600 mt-2 list-disc list-inside">
                            <li>Microphone Anda (suara berbicara)</li>
                            <li>System Audio (meeting online, YouTube, aplikasi lain)</li>
                            <li>Semua audio digabung menjadi satu transcript</li>
                        </ul>
                        <p className="text-xs text-green-500 mt-2">
                            Perfect untuk meeting online dimana Anda berbicara dan mendengar peserta lain.
                        </p>
                    </div>
                </div>
            </Card>

            {/* File Upload */}
            <Card className="p-4 border-dashed border-2 border-slate-300">
                <div className="text-center">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <Label htmlFor="audio-upload" className="cursor-pointer">
                        <span className="text-lg font-medium text-slate-700">Upload Audio File</span>
                        <p className="text-sm text-slate-500 mt-1">Support: MP3, WAV, M4A (Max 100MB)</p>
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
                            <Button variant="outline" size="sm" onClick={isPlaying ? pauseAudio : playAudio}>
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <audio ref={audioRef} className="hidden" />
                </Card>
            )}

            {/* Live Transcript Preview */}
            {(permanentTranscript || interimTranscript) && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-blue-800">
                                Live Transcript Preview (Mixed Audio)
                            </span>
                        </div>
                        <div className="text-sm text-blue-700 min-h-[40px] p-2 bg-white rounded border max-h-32 overflow-y-auto">
                            <span className="font-medium">{permanentTranscript}</span>
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
                            <p className="font-medium text-green-800">Processing Mixed Audio...</p>
                            <p className="text-sm text-green-600">
                                AI sedang memproses audio gabungan dari microphone dan system secara real-time
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default AudioRecorder;
