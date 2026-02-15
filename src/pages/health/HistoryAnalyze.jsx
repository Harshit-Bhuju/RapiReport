import React, { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BrainCircuit,
  FileDown,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useHealthStore } from "@/store/healthStore";

const HistoryAnalyze = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef(null);
  const historyAnalysis = useHealthStore((s) => s.historyAnalysis);

  // Get analysis from location state, store, or fallback
  const analysis =
    location.state?.analysis ||
    location.state?.historyAnalysis ||
    historyAnalysis ||
    "No analysis available. Please run \"Analyze All History\" from the Medical History page.";

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header - hidden when printing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/medical-history")}
            className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Medical History
          </Button>
        </div>
        <Button
          onClick={handlePrintPdf}
          className="gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 print:hidden">
          <FileDown className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Report content - print-friendly */}
      <div
        ref={printRef}
        className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden print:shadow-none print:border-0">
        {/* Report header */}
        <div className="bg-gradient-to-r from-indigo-600 to-primary-600 p-6 sm:p-8 text-white print:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Health Intelligence Report</h1>
              <p className="text-white/80 text-sm font-medium uppercase tracking-widest mt-0.5">
                Comprehensive AI Clinical Summary
              </p>
              <p className="text-white/70 text-xs mt-2">
                Generated on {new Date().toLocaleDateString()} at{" "}
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Report body */}
        <div className="p-6 sm:p-8 print:p-8">
          <div className="prose prose-sm sm:prose-base prose-primary max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-indigo-600 prose-ul:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 print:bg-gray-50">
          <div className="flex items-start gap-2 text-primary-600">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-relaxed">
              AI Insights are for guidance only. This report does not constitute
              medical advice. Please consult a qualified doctor for clinical
              diagnosis and treatment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryAnalyze;
