import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Mic, FileText, Brain, Zap, Shield, Globe} from "lucide-react";
import {Link} from "react-router-dom";

const Index = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Navigation */}
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <img src="/favicon.ico" alt="talkwise-logo" className="h-8 w-8 text-blue-600" />
                    <span className="text-2xl font-bold text-gradient">TalkWise</span>
                </div>
                <div className="flex space-x-4">
                    <Link to="/transcribe">
                        <Button variant="ghost">Mulai Transcribe</Button>
                    </Link>
                    <Link to="/dashboard">
                        <Button variant="ghost">Dashboard</Button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-6xl font-bold mb-6 text-gradient">
                        AI yang Memahami
                        <br />
                        <span className="text-slate-800">Setiap Percakapan</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                        TalkWise menggunakan kecerdasan buatan canggih untuk mengubah audio meeting Anda menjadi
                        transkrip yang akurat dan ringkasan yang bermakna
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/transcribe">
                            <Button size="lg" className="gradient-primary text-white hover:opacity-90 px-8 py-3">
                                <Mic className="mr-2 h-5 w-5" />
                                Mulai Transcribe
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="px-8 py-3">
                            <FileText className="mr-2 h-5 w-5" />
                            Lihat Demo
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-slate-800">Fitur Unggulan</h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Teknologi AI terdepan untuk memproses dan memahami percakapan Anda
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="p-8 hover-lift glassmorphism border-0 shadow-lg">
                        <div className="gradient-accent w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Mic className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Real-time Transcription</h3>
                        <p className="text-slate-600">
                            Transcribe percakapan secara real-time dengan akurasi tinggi dari berbagai platform meeting
                        </p>
                    </Card>

                    <Card className="p-8 hover-lift glassmorphism border-0 shadow-lg">
                        <div className="gradient-primary w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Brain className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">AI Summarization</h3>
                        <p className="text-slate-600">
                            Ringkasan otomatis yang mengekstrak poin-poin penting dari meeting Anda
                        </p>
                    </Card>

                    <Card className="p-8 hover-lift glassmorphism border-0 shadow-lg">
                        <div className="gradient-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Audio Processing</h3>
                        <p className="text-slate-600">
                            Middleware canggih yang membersihkan dan mengoptimalkan kualitas audio
                        </p>
                    </Card>
                </div>
            </section>

            {/* How It Works */}
            <section className="container mx-auto px-6 py-20 bg-white/50 rounded-3xl mx-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-slate-800">Cara Kerja</h2>
                    <p className="text-xl text-slate-600">Proses sederhana dengan hasil yang powerful</p>
                </div>

                <div className="grid md:grid-cols-4 gap-8">
                    <div className="text-center">
                        <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-xl">1</span>
                        </div>
                        <h3 className="font-semibold mb-2">Upload Audio</h3>
                        <p className="text-sm text-slate-600">Upload file audio atau record langsung</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-xl">2</span>
                        </div>
                        <h3 className="font-semibold mb-2">AI Processing</h3>
                        <p className="text-sm text-slate-600">Middleware membersihkan dan memproses audio</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-xl">3</span>
                        </div>
                        <h3 className="font-semibold mb-2">Transcription</h3>
                        <p className="text-sm text-slate-600">Konversi audio ke teks dengan akurasi tinggi</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-xl">4</span>
                        </div>
                        <h3 className="font-semibold mb-2">Summarization</h3>
                        <p className="text-sm text-slate-600">Generate ringkasan dan insights</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-20 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-bold mb-6 text-slate-800">Siap Mengubah Meeting Anda?</h2>
                    <p className="text-xl text-slate-600 mb-8">
                        Bergabunglah dengan ribuan profesional yang sudah menggunakan TalkWise untuk meningkatkan
                        produktivitas meeting mereka
                    </p>
                    <Link to="/transcribe">
                        <Button size="lg" className="gradient-primary text-white hover:opacity-90 px-12 py-4 text-lg">
                            Mulai Sekarang - Gratis
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Brain className="h-6 w-6" />
                        <span className="text-xl font-bold">TalkWise</span>
                    </div>
                    <p className="text-slate-400 mb-4">AI-powered meeting transcription and summarization</p>
                    <div className="flex justify-center space-x-6 text-sm text-slate-400">
                        <span>© 2024 TalkWise</span>
                        <span>•</span>
                        <span>Privacy Policy</span>
                        <span>•</span>
                        <span>Terms of Service</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Index;
