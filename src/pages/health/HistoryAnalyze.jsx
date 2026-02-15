import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrainCircuit, FileDown, Printer, ShieldAlert, ChevronLeft, Sparkles, Brain } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuthStore } from "@/store/authStore";
import { useHealthStore } from "@/store/healthStore";

const HistoryAnalyze = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const historyAnalysis = useHealthStore((s) => s.historyAnalysis);

    const analysis = state?.analysis || historyAnalysis;

    const handlePrint = () => {
        window.print();
    };

    if (!analysis) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-gray-200" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No analysis found</p>
                <Button onClick={() => navigate("/medical-history")} variant="outline">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between no-print">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/medical-history")}
                    className="gap-2 text-gray-500 hover:text-primary-600 font-bold"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to History
                </Button>
                <Button
                    onClick={handlePrint}
                    className="gap-2 bg-primary-600 shadow-lg shadow-primary-200"
                >
                    <FileDown className="w-4 h-4" />
                    Save as PDF
                </Button>
            </div>

            {/* Main Analysis Card */}
            <Card className="border-none shadow-2xl shadow-primary-100 overflow-hidden print:shadow-none print:border-none">
                <CardBody className="p-0">
                    <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <BrainCircuit className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight uppercase">Clinical Intelligence Report</h1>
                                    <p className="text-white/80 text-xs font-black tracking-[0.2em] uppercase mt-1">
                                        Powered by RapiReport Gemini
                                    </p>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-none">Date Generated</p>
                                <p className="text-sm font-bold mt-1">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 sm:p-12">
                        <div className="prose prose-sm sm:prose-base prose-primary max-w-none 
              prose-headings:font-black prose-headings:text-gray-900 
              prose-p:text-gray-700 prose-p:leading-relaxed 
              prose-strong:text-primary-700 prose-li:text-gray-700">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {analysis}
                            </ReactMarkdown>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 space-y-6">
                            <div className="bg-gray-50 p-6 rounded-3xl flex items-start gap-4 border border-gray-100 italic">
                                <ShieldAlert className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    <strong>Medical Disclaimer:</strong> This health analysis is generated using Artificial Intelligence based on your
                                    provided medical records and history. It is intended for educational and informational purposes only. It is NOT
                                    a clinical diagnosis. Please consult with a licensed healthcare professional before making any medical decisions.
                                </p>
                            </div>

                            <div className="flex flex-col items-center justify-center text-center space-y-2 opacity-30">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Locked & Verified Clinical Record</p>
                                <p className="text-[10px] font-bold text-gray-300 uppercase">Authenticated For: {user?.name || user?.username || "Authorized User"}</p>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Hidden high-quality print template */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .card { border: none !important; box-shadow: none !important; }
          .prose { font-size: 12pt !important; }
        }
      `}} />
        </div>
    );
};

export default HistoryAnalyze;
