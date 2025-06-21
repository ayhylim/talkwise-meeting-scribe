
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, ArrowLeft, FileText, Download, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface TranscriptRecord {
  id: string;
  title: string;
  transcript: string;
  summary: string;
  createdAt: Date;
  duration: string;
}

const Dashboard = () => {
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);

  useEffect(() => {
    // Load transcripts from localStorage
    const savedTranscripts = localStorage.getItem("talkwise-transcripts");
    if (savedTranscripts) {
      const parsed = JSON.parse(savedTranscripts);
      setTranscripts(parsed.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt)
      })));
    }
  }, []);

  const handleDelete = (id: string) => {
    const updatedTranscripts = transcripts.filter(t => t.id !== id);
    setTranscripts(updatedTranscripts);
    localStorage.setItem("talkwise-transcripts", JSON.stringify(updatedTranscripts));
  };

  const handleDownload = (transcript: TranscriptRecord) => {
    const content = `TalkWise Transcript - ${transcript.title}
Created: ${transcript.createdAt.toLocaleDateString()}
Duration: ${transcript.duration}

TRANSCRIPT:
${transcript.transcript}

SUMMARY:
${transcript.summary}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcript.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
        <Link to="/transcribe">
          <Button className="gradient-primary text-white">
            Transcribe Baru
          </Button>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-gradient">
              Dashboard Transcript
            </h1>
            <p className="text-xl text-slate-600">
              Kelola dan review semua transcript meeting Anda
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 glassmorphism border-0 shadow-lg">
              <div className="flex items-center">
                <div className="gradient-primary w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Transcripts</p>
                  <p className="text-2xl font-bold">{transcripts.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glassmorphism border-0 shadow-lg">
              <div className="flex items-center">
                <div className="gradient-secondary w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">AI Summaries</p>
                  <p className="text-2xl font-bold">{transcripts.filter(t => t.summary).length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glassmorphism border-0 shadow-lg">
              <div className="flex items-center">
                <div className="gradient-accent w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Words Processed</p>
                  <p className="text-2xl font-bold">
                    {transcripts.reduce((acc, t) => acc + t.transcript.split(' ').length, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Transcripts List */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Recent Transcripts</h2>
            
            {transcripts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  Belum ada transcript
                </h3>
                <p className="text-slate-500 mb-6">
                  Mulai transcribe meeting pertama Anda untuk melihat hasilnya di sini
                </p>
                <Link to="/transcribe">
                  <Button className="gradient-primary text-white">
                    Mulai Transcribe
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {transcripts.map((transcript) => (
                  <Card key={transcript.id} className="p-4 hover-lift">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{transcript.title}</h3>
                        <p className="text-slate-600 text-sm mb-2">
                          {transcript.createdAt.toLocaleDateString()} • {transcript.duration}
                        </p>
                        <p className="text-slate-700 line-clamp-2">
                          {transcript.transcript.substring(0, 200)}...
                        </p>
                        {transcript.summary && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-1">AI Summary:</p>
                            <p className="text-blue-700 text-sm">
                              {transcript.summary.substring(0, 150)}...
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(transcript)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(transcript.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
