import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, ArrowLeft, FileText, Download, Trash2, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";

interface TranscriptRecord {
  id: string;
  title: string;
  transcript: string;
  summary: string;
  createdAt: Date;
  duration: string;
}

interface ScheduleRecord {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
}

const Dashboard = () => {
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [newScheduleDescription, setNewScheduleDescription] = useState("");
  const [newScheduleDate, setNewScheduleDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Load transcripts from localStorage
    const savedTranscripts = localStorage.getItem("talkwise-transcripts");
      if (savedTranscripts) {
        const parsed: TranscriptRecord[] = JSON.parse(savedTranscripts);
        setTranscripts(parsed.map((t) => ({
          ...t,
          createdAt: new Date(t.createdAt)
        })));
      }
    // Load schedules from localStorage
    const savedSchedules = localStorage.getItem("talkwise-schedules");
    if (savedSchedules) {
      const parsed = JSON.parse(savedSchedules);
      setSchedules(parsed);
    }
  }, []);

  useEffect(() => {
    // Check for schedules 24 hours before and show notification
    const interval = setInterval(() => {
      const now = new Date();
      schedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.date);
        const diff = scheduleDate.getTime() - now.getTime();
        if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
          toast({
            title: "Pengingat Jadwal",
            description: `Besok ada acara: ${schedule.title}`,
          });
        }
      });
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [schedules]);

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

  const handleAddSchedule = () => {
    if (!newScheduleTitle || !newScheduleDate) {
      toast({
        title: "Error",
        description: "Judul dan tanggal harus diisi",
        variant: "destructive",
      });
      return;
    }
    const newSchedule: ScheduleRecord = {
      id: Date.now().toString(),
      title: newScheduleTitle,
      description: newScheduleDescription,
      date: newScheduleDate.toISOString(),
    };
    const updatedSchedules = [...schedules, newSchedule];
    setSchedules(updatedSchedules);
    localStorage.setItem("talkwise-schedules", JSON.stringify(updatedSchedules));
    setNewScheduleTitle("");
    setNewScheduleDescription("");
    setNewScheduleDate(undefined);
    toast({
      title: "Jadwal Ditambahkan",
      description: `Jadwal "${newScheduleTitle}" berhasil ditambahkan.`,
    });
  };

  const handleDeleteSchedule = (id: string) => {
    const updatedSchedules = schedules.filter(s => s.id !== id);
    setSchedules(updatedSchedules);
    localStorage.setItem("talkwise-schedules", JSON.stringify(updatedSchedules));
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
        <div className="flex space-x-4">
          <Link to="/transcribe">
            <Button className="gradient-primary text-white">
              Transcribe Baru
            </Button>
          </Link>
          <Button
            variant="outline"
            className="flex items-center space-x-2"
            onClick={() => setShowSchedule(!showSchedule)}
          >
            <CalendarIcon className="h-5 w-5" />
            <span>Jadwal</span>
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {!showSchedule ? (
            <>
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
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4 text-gradient">Jadwal Saya</h1>
                <p className="text-xl text-slate-600 mb-6">
                  Kelola jadwal Anda dan dapatkan notifikasi 24 jam sebelum acara
                </p>
                <Card className="p-6 mb-6">
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Judul</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={newScheduleTitle}
                      onChange={(e) => setNewScheduleTitle(e.target.value)}
                      placeholder="Judul acara"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Deskripsi</label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={newScheduleDescription}
                      onChange={(e) => setNewScheduleDescription(e.target.value)}
                      placeholder="Deskripsi acara"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Tanggal & Waktu</label>
                    <Calendar
                      mode="single"
                      selected={newScheduleDate}
                      onSelect={setNewScheduleDate}
                      disabled={(date) => date < new Date()}
                    />
                    <input
                      type="time"
                      className="mt-2 w-full rounded-md border border-gray-300 p-2"
                      value={newScheduleDate ? newScheduleDate.toTimeString().slice(0, 5) : ""}
                      onChange={(e) => {
                        if (newScheduleDate) {
                          const [hours, minutes] = e.target.value.split(":").map(Number);
                          const updatedDate = new Date(newScheduleDate);
                          updatedDate.setHours(hours);
                          updatedDate.setMinutes(minutes);
                          setNewScheduleDate(updatedDate);
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleAddSchedule} className="gradient-primary text-white">
                    <Plus className="inline-block mr-2 h-5 w-5" />
                    Tambah Jadwal
                  </Button>
                </Card>

                {schedules.length === 0 ? (
                  <p className="text-center text-slate-600">Belum ada jadwal</p>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <Card key={schedule.id} className="p-4 hover-lift flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">{schedule.title}</h3>
                          <p className="text-slate-600 text-sm">{new Date(schedule.date).toLocaleString()}</p>
                          {schedule.description && <p className="text-slate-700">{schedule.description}</p>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
