
import React, { useEffect, useRef, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, FileText, Edit, Save, X } from "lucide-react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTranscript, setEditedTranscript] = React.useState("");
  const [autoScroll, setAutoScroll] = React.useState(true);
  const { toast } = useToast();

  // Enhanced auto-scroll to bottom when new text is added
  useEffect(() => {
    if (scrollRef.current && !isEditing && autoScroll && isProcessing) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [transcript, isEditing, autoScroll, isProcessing]);

  // Update edited transcript when original changes (only if not currently editing)
  useEffect(() => {
    if (!isEditing) {
      setEditedTranscript(transcript);
    }
  }, [transcript, isEditing]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (scrollRef.current && isProcessing) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setAutoScroll(isAtBottom);
    }
  };

  // Memoized transcript processing for better performance
  const processedTranscript = useMemo(() => {
    if (!transcript) return [];
    
    // Split by sentences and clean up
    const sentences = transcript
      .split(/(?<=[.!?])\s+/)
      .filter(sentence => sentence.trim())
      .map(sentence => sentence.trim());
    
    return sentences;
  }, [transcript]);

  const copyToClipboard = () => {
    const textToCopy = isEditing ? editedTranscript : transcript;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied!",
      description: "Transcript telah disalin ke clipboard",
    });
  };

  const downloadTranscript = () => {
    const textToDownload = isEditing ? editedTranscript : transcript;
    const blob = new Blob([textToDownload], { type: 'text/plain' });
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

  const startEditing = () => {
    setIsEditing(true);
    setEditedTranscript(transcript);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
      }
    }, 100);
  };

  const saveEdit = () => {
    setIsEditing(false);
    toast({
      title: "Saved!",
      description: "Perubahan transcript telah disimpan",
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedTranscript(transcript);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  // Word and character count
  const wordCount = useMemo(() => {
    const text = isEditing ? editedTranscript : transcript;
    return text.split(' ').filter(word => word.trim()).length;
  }, [transcript, editedTranscript, isEditing]);

  const charCount = useMemo(() => {
    const text = isEditing ? editedTranscript : transcript;
    return text.length;
  }, [transcript, editedTranscript, isEditing]);

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
              <span className="text-sm text-green-600">Live & Continuous</span>
            </div>
          )}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Edit className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-600">Editing</span>
            </div>
          )}
        </div>
        
        {transcript && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={saveEdit}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTranscript}>
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Transcript Content with Enhanced Scrolling */}
      <div className="flex-1 flex flex-col min-h-0">
        {transcript ? (
          <>
            {isEditing ? (
              <Textarea
                ref={textareaRef}
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                className="flex-1 resize-none text-slate-700 leading-relaxed min-h-[400px]"
                placeholder="Edit your transcript here..."
              />
            ) : (
              <div className="flex-1 relative">
                <ScrollArea className="h-full">
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto p-4 bg-slate-50 rounded-lg border"
                  >
                    <div className="space-y-2">
                      {transcript.length > 0 ? (
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                          {transcript}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">
                          Mulai berbicara untuk melihat transcript kontinyu...
                        </div>
                      )}
                      
                      {isProcessing && (
                        <div className="flex items-center space-x-2 text-slate-500 mt-4 sticky bottom-0 bg-slate-50/90 backdrop-blur-sm p-2 rounded">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm">AI mendengarkan secara kontinyu...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
                
                {/* Scroll Controls */}
                {!autoScroll && isProcessing && (
                  <Button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 opacity-80 hover:opacity-100"
                    size="sm"
                    variant="secondary"
                  >
                    ↓ Latest
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border">
            <FileText className="h-16 w-16 mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum ada transcript</h3>
            <p className="text-sm text-center max-w-md">
              Mulai recording atau upload file audio untuk melihat transcript kontinyu real-time di sini
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Stats */}
      {transcript && (
        <div className="mt-4 flex justify-between items-center text-sm text-slate-500 bg-slate-100 rounded-lg p-3">
          <div className="flex space-x-4">
            <span>{wordCount} kata</span>
            <span>{charCount} karakter</span>
            <span>{processedTranscript.length} kalimat</span>
          </div>
          <div className="flex items-center space-x-4">
            {isProcessing && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600">Kontinyu & Responsif</span>
              </div>
            )}
            <span className="text-xs">Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptViewer;
