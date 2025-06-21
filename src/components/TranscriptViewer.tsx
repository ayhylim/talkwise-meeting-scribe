
import React, { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptViewerProps {
  transcript: string;
  isProcessing: boolean;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  isProcessing,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll to bottom when new text is added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
    toast({
      title: "Copied!",
      description: "Transcript telah disalin ke clipboard",
    });
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Transcript berhasil didownload",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="font-medium">Live Transcript</span>
          {isProcessing && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Live</span>
            </div>
          )}
        </div>
        
        {transcript && (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTranscript}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Transcript Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-lg border"
      >
        {transcript ? (
          <div className="space-y-3">
            {transcript.split('.').filter(sentence => sentence.trim()).map((sentence, index) => (
              <p key={index} className="text-slate-700 leading-relaxed">
                {sentence.trim()}.
              </p>
            ))}
            
            {isProcessing && (
              <div className="flex items-center space-x-2 text-slate-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">AI sedang mendengarkan...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <FileText className="h-16 w-16 mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum ada transcript</h3>
            <p className="text-sm text-center">
              Mulai recording atau upload file audio untuk melihat transcript real-time di sini
            </p>
          </div>
        )}
      </div>

      {/* Word Count */}
      {transcript && (
        <div className="mt-4 text-sm text-slate-500">
          <span>{transcript.split(' ').filter(word => word.trim()).length} kata</span>
          <span className="mx-2">•</span>
          <span>{transcript.length} karakter</span>
        </div>
      )}
    </div>
  );
};

export default TranscriptViewer;
