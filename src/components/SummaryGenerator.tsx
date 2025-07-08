import React, {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Brain, Copy, Download, Sparkles} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import Markdown from "markdown-to-jsx";

interface SummaryGeneratorProps {
    transcript: string;
}

const SummaryGenerator: React.FC<SummaryGeneratorProps> = ({transcript}) => {
    const [summary, setSummary] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [keyPoints, setKeyPoints] = useState<string[]>([]);
    const [actionItems, setActionItems] = useState<string[]>([]);
    const {toast} = useToast();

    const generateSummary = async () => {
        if (!transcript.trim()) {
            toast({
                title: "Error",
                description: "Tidak ada transcript untuk dirangkum",
                variant: "destructive"
            });
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch("http://localhost:3001/summarize", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({transcript})
            });

            if (!response.ok) {
                throw new Error("-led to generate summary");
            }

            const data = await response.json();
            setSummary(data.summary || "Error: No Output Expected!");
            // Tambahan parsing manual sederhana:
            const lines = (data.summary || "")
                .split("\\n")
                .map(l => l.trim())
                .filter(Boolean);
            const parsedKeyPoints = lines.filter(line => line.startsWith("-") || line.startsWith("•"));
            const parsedActions = lines.filter(line => line.startsWith("□") || line.toLowerCase().includes("action:"));

            setKeyPoints(parsedKeyPoints.map(p => p.replace(/^[-•]\s*/, "")));
            setActionItems(parsedActions.map(a => a.replace(/^□\s*|action:\s*/i, "")));

            setKeyPoints(data.key_points || []);
            setActionItems(data.action_items || []);
            setIsGenerating(false);

            // Save to localStorage
            const transcriptRecord = {
                id: Date.now().toString(),
                title: `Meeting Summary ${new Date().toLocaleDateString()}`,
                transcript: transcript,
                summary: data.summary || "",
                createdAt: new Date(),
                duration: "00:00:00"
            };

            const existingTranscripts = JSON.parse(localStorage.getItem("talkwise-transcripts") || "[]");
            const updatedTranscripts = existingTranscripts.map((t: any) =>
                t.transcript === transcript ? {...t, summary: data.summary || ""} : t
            );

            if (!updatedTranscripts.some((t: any) => t.transcript === transcript)) {
                updatedTranscripts.unshift(transcriptRecord);
            }

            localStorage.setItem("talkwise-transcripts", JSON.stringify(updatedTranscripts));

            toast({
                title: "Summary Generated!",
                description: "AI telah menganalisis dan membuat ringkasan meeting"
            });
        } catch (error) {
            setIsGenerating(false);
            toast({
                title: "Error",
                description: (error as Error).message || "Gagal membuat ringkasan",
                variant: "destructive"
            });
        }
    };

    const copySummary = () => {
        const fullSummary = `RINGKASAN MEETING (TalkWise AI)
${new Date().toLocaleDateString()}

${summary}

KEY POINTS:
${keyPoints.map(point => `• ${point}`).join("\n")}

ACTION ITEMS:
${actionItems.map(item => `□ ${item}`).join("\n")}`;

        navigator.clipboard.writeText(fullSummary);
        toast({
            title: "Copied!",
            description: "Summary telah disalin ke clipboard"
        });
    };

    const downloadSummary = () => {
        const content = `RINGKASAN MEETING (TalkWise AI)
Generated: ${new Date().toLocaleString()}

SUMMARY:
${summary}

KEY POINTS:
${keyPoints.map(point => `• ${point}`).join("\n")}

ACTION ITEMS:
${actionItems.map(item => `□ ${item}`).join("\n")}

---
Original Transcript:
${transcript}`;

        const blob = new Blob([content], {type: "text/plain"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meeting-summary-${new Date().toISOString().split("T")[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Downloaded!",
            description: "Summary berhasil didownload"
        });
    };

    return (
        <div className="space-y-4">
            {/* Generate Button */}
            <Button
                onClick={generateSummary}
                disabled={isGenerating || !transcript.trim()}
                className="w-full gradient-primary text-white"
            >
                {isGenerating ? (
                    <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        AI Menganalisis...
                    </>
                ) : (
                    <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate AI Summary
                    </>
                )}
            </Button>

            {/* Processing Status */}
            {isGenerating && (
                <Card className="p-4 bg-purple-50 border-purple-200">
                    <div className="flex items-center space-x-3">
                        <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                        <div>
                            <p className="font-medium text-purple-800">AI Processing...</p>
                            <p className="text-sm text-purple-600">
                                Menganalisis konteks, ekstraksi key points, dan membuat ringkasan
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Summary Results */}
            {summary && (
                <div className="space-y-4">
                    {/* Summary Text */}
                    <Card className="p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold flex items-center">
                                <Brain className="h-4 w-4 mr-2 text-blue-600" />
                                Ringkasan Penjelasan
                            </h3>
                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={copySummary}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={downloadSummary}>
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="prose prose-sm max-w-none text-slate-700">
                            <Markdown
                                options={{
                                    overrides: {
                                        strong: {
                                            props: {
                                                className: "text-blue-800 font-semibold"
                                            }
                                        },
                                        li: {
                                            props: {
                                                className: "mb-2 leading-relaxed"
                                            }
                                        },
                                        ul: {
                                            props: {
                                                className: "list-disc pl-6"
                                            }
                                        },
                                        p: {
                                            props: {
                                                className: "mb-4"
                                            }
                                        }
                                    }
                                }}
                            >
                                {summary}
                            </Markdown>
                        </div>
                    </Card>

                    {/* Key Points */}
                    <Card className="p-4">
                        <ul className="space-y-2">
                            {keyPoints.map((point, index) => (
                                <li key={index} className="flex items-start">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <span className="text-slate-700">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Action Items */}
                    <Card className="p-4">
                        <ul className="space-y-2">
                            {actionItems.map((item, index) => (
                                <li key={index} className="flex items-start">
                                    <div className="w-4 h-4 border-2 border-orange-500 rounded mt-1 mr-3 flex-shrink-0"></div>
                                    <span className="text-slate-700">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SummaryGenerator;
