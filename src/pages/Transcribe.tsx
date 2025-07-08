import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Brain, ArrowLeft} from "lucide-react";
import {Link} from "react-router-dom";
import AudioRecorder from "@/components/AudioRecorder";
import TranscriptViewer from "@/components/TranscriptViewer";
import SummaryGenerator from "@/components/SummaryGenerator";

const Transcribe = () => {
    const [transcript, setTranscript] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTranscriptComplete = (text: string) => {
        setTranscript(text);
        setIsProcessing(false);
    };

    const handleTranscriptUpdate = (updatedText: string) => {
        setTranscript(updatedText);
    };

    const handleProcessingStart = () => {
        setIsProcessing(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Navigation */}
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Link to="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                    <div className="flex items-center space-x-2">
                        <Brain className="h-8 w-8 text-blue-600" />
                        <span className="text-2xl font-bold text-gradient">TalkWise</span>
                    </div>
                </div>
                <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                </Link>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-4 text-gradient">AI Transcription Studio</h1>
                        <p className="text-xl text-slate-600">
                            Upload audio atau record langsung untuk mendapatkan transkrip dan ringkasan AI
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Left Column - Recording/Upload */}
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h2 className="text-2xl font-semibold mb-4">Audio Input</h2>
                                <AudioRecorder
                                    onTranscriptReady={handleTranscriptComplete}
                                    onProcessingStart={handleProcessingStart}
                                />
                            </Card>

                            {transcript && (
                                <Card className="p-6">
                                    <h2 className="text-2xl font-semibold mb-4">AI Summary</h2>
                                    <SummaryGenerator transcript={transcript} />
                                </Card>
                            )}
                        </div>

                        {/* Right Column - Transcript */}
                        <div className="space-y-6">
                            <Card className="p-6 h-[600px]">
                                <h2 className="text-2xl font-semibold mb-4">Live Transcript</h2>
                                <TranscriptViewer
                                    transcript={transcript}
                                    isProcessing={isProcessing}
                                    onTranscriptUpdate={handleTranscriptUpdate}
                                />
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transcribe;
