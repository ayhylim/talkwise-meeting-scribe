import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Mic, FileText, Brain, Zap, Shield, Globe, Calendar} from "lucide-react";
import {Link} from "react-router-dom";
import {motion} from "framer-motion";
import FadeInOnScroll from "@/components/animations/FadeInOnScroll";

const Index = () => {
    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 1}}
            className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"
        >
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
                <FadeInOnScroll>
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
                            <Link to="/dashboard?schedule=true">
                                <Button size="lg" className="gradient-primary text-white hover:opacity-90 px-8 py-3">
                                    <Calendar className="mr-2 h-5 w-5" />
                                    Schedule
                                </Button>
                            </Link>
                        </div>
                    </div>
                </FadeInOnScroll>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-6 py-20">
                <FadeInOnScroll>
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4 text-slate-800">Fitur Unggulan</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Teknologi AI terdepan untuk memproses dan memahami percakapan Anda
                        </p>
                    </div>
                </FadeInOnScroll>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Mic className="h-6 w-6 text-white" />,
                            title: "Real-time Transcription",
                            desc: "Transcribe percakapan secara real-time dengan akurasi tinggi dari berbagai platform meeting",
                            gradient: "gradient-accent"
                        },
                        {
                            icon: <Brain className="h-6 w-6 text-white" />,
                            title: "AI Summarization",
                            desc: "Ringkasan otomatis yang mengekstrak poin-poin penting dari meeting Anda",
                            gradient: "gradient-primary"
                        },
                        {
                            icon: <Zap className="h-6 w-6 text-white" />,
                            title: "Audio Processing",
                            desc: "Middleware canggih yang membersihkan dan mengoptimalkan kualitas audio",
                            gradient: "gradient-secondary"
                        }
                    ].map((feature, index) => (
                        <FadeInOnScroll key={index} delay={index * 0.1}>
                            <Card className="p-6 hover:scale-105 transition duration-300 ease-out glassmorphism border-0 shadow-lg">
                                <div
                                    className={`${feature.gradient} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
                                >
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-slate-600">{feature.desc}</p>
                            </Card>
                        </FadeInOnScroll>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="container mx-auto px-6 py-20 bg-white/50 rounded-3xl mx-6">
                <FadeInOnScroll>
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4 text-slate-800">Cara Kerja</h2>
                        <p className="text-xl text-slate-600">Proses sederhana dengan hasil yang powerful</p>
                    </div>
                </FadeInOnScroll>

                <div className="grid md:grid-cols-4 gap-8">
                    {["Upload Audio", "AI Processing", "Transcription", "Summarization"].map((step, index) => (
                        <FadeInOnScroll key={index} delay={index * 0.1}>
                            <div className="text-center">
                                <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white font-bold text-xl">{index + 1}</span>
                                </div>
                                <h3 className="font-semibold mb-2">{step}</h3>
                                <p className="text-sm text-slate-600">
                                    {index === 0 && "Upload file audio atau record langsung"}
                                    {index === 1 && "Middleware membersihkan dan memproses audio"}
                                    {index === 2 && "Konversi audio ke teks dengan akurasi tinggi"}
                                    {index === 3 && "Generate ringkasan dan insights"}
                                </p>
                            </div>
                        </FadeInOnScroll>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-20 text-center">
                <FadeInOnScroll>
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-4xl font-bold mb-6 text-slate-800">Siap Mengubah Meeting Anda?</h2>
                        <p className="text-xl text-slate-600 mb-8">
                            Bergabunglah dengan ribuan profesional yang sudah menggunakan TalkWise untuk meningkatkan
                            produktivitas meeting mereka
                        </p>
                        <Link to="/transcribe">
                            <Button
                                size="lg"
                                className="gradient-primary text-white hover:opacity-90 px-12 py-4 text-lg"
                            >
                                Mulai Sekarang - Gratis
                            </Button>
                        </Link>
                    </div>
                </FadeInOnScroll>
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
        </motion.div>
    );
};

export default Index;
