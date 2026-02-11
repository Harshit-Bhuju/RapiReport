import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  ArrowLeft,
  Download,
  Share2,
  Play,
  AlertCircle,
  CheckCircle2,
  Activity,
  Calendar,
  Microscope,
  Stethoscope,
  Info,
} from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardFooter } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate, cn } from "@/lib/utils";

const MedicineInsight = React.lazy(
  () => import("@/components/features/MedicineInsight"),
);

// Simple Loading component for Suspense fallback
const Loading = () => (
  <Card className="border-none shadow-sm">
    <CardBody className="p-6 text-center text-gray-500">
      Loading medicine insights...
    </CardBody>
  </Card>
);

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock Data
  const report = {
    patient: "Prashant Dahal",
    age: 28,
    gender: "Male",
    date: "2025-01-15",
    lab: "Kathmandu Diagnostic Center",
    type: "Comprehensive Blood Analysis",
    tests: [
      {
        name: "Hemoglobin (Hb)",
        result: 12.5,
        unit: "g/dL",
        range: "13.5 - 17.5",
        status: "low",
      },
      {
        name: "White Blood Cell (WBC)",
        result: 7200,
        unit: "cells/mcL",
        range: "4500 - 11000",
        status: "normal",
      },
      {
        name: "Platelets",
        result: 210000,
        unit: "cells/mcL",
        range: "150000 - 450000",
        status: "normal",
      },
      {
        name: "Fasting Blood Sugar",
        result: 105,
        unit: "mg/dL",
        range: "70 - 100",
        status: "high",
      },
    ],
    aiSummary: {
      en: "Your results show slightly low hemoglobin and marginally high blood sugar. You may feel tired more often. Increasing iron-rich foods and reducing refined sugar is recommended.",
      ne: "तपाईंको रिपोर्टमा हेमोग्लोबिन अलि कम र ब्लड सुगर थोरै उच्च देखिएको छ। तपाईंलाई थकान महसुस हुन सक्छ। आइरनयुक्त खाना बढाउन र चिनी कम गर्न सल्लाह दिइन्छ।",
    },
    medicines: [
      {
        name: "Iron Supplement (Dexorange)",
        type: "Syrup / Capsule",
        dosage: "10ml",
        timingEn: "Twice daily after meals",
        timingNe: "खाना खाएपछि दिनमा दुई पटक",
        descEn:
          "Helps increase red blood cell count and improves hemoglobin levels.",
        descNe:
          "यसले रेड ब्लड सेल बढाउन र हेमोग्लोबिनको स्तर सुधार्न मद्दत गर्दछ।",
      },
      {
        name: "Metformin",
        type: "Tablet",
        dosage: "500mg",
        timingEn: "Once daily with dinner",
        timingNe: "बेलुकाको खानासँगै दिनमा एक पटक",
        descEn:
          "Helps control blood sugar levels by improving body response to insulin.",
        descNe:
          "यसले इन्सुलिनको प्रतिक्रिया सुधारेर रगतमा चिनीको मात्रा नियन्त्रण गर्न मद्दत गर्दछ।",
      },
    ],
  };

  const toggleVoice = () => {
    setIsPlaying(!isPlaying);
    // In real app, trigger text-to-speech API
  };

  return (
    <PageWrapper>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-primary-600 -ml-4">
          <ArrowLeft className="mr-2 w-5 h-5" />
          {t("common.back")}
        </Button>
        <div className="flex gap-4 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none">
            <Share2 className="mr-2 w-4 h-4" />
            Share
          </Button>
          <Button variant="secondary" className="flex-1 md:flex-none">
            <Download className="mr-2 w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Overview */}
        <div className="lg:col-span-2 space-y-12">
          <Card className="border-none shadow-sm overflow-visible relative">
            <div className="absolute -top-4 -right-4 p-4 rounded-full bg-primary-600 text-white shadow-xl animate-pulse">
              <Microscope className="w-6 h-6" />
            </div>
            <CardHeader className="border-none pt-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <Badge variant="primary" className="mb-2">
                    OFFICIAL REPORT
                  </Badge>
                  <h1 className="text-2xl font-black text-gray-900">
                    {report.type}
                  </h1>
                  <p className="text-sm font-bold text-gray-500 mt-1">
                    {report.lab}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 font-bold">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  {formatDate(report.date, "PP")}
                </div>
              </div>
            </CardHeader>
            <CardBody className="py-8">
              <div className="grid grid-cols-1 gap-4">
                {report.tests.map((test, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-primary-200 transition-colors">
                    <div className="flex items-center gap-4">
                      {test.status === "normal" ? (
                        <CheckCircle2 className="w-5 h-5 text-success-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-error-500" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {test.name}
                        </p>
                        <p className="text-xs font-semibold text-gray-400">
                          Ref Range: {test.range}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                      <p className="text-lg font-black text-gray-900">
                        {test.result}{" "}
                        <span className="text-xs text-gray-400 font-bold uppercase">
                          {test.unit}
                        </span>
                      </p>
                      <Badge
                        variant={test.status === "normal" ? "success" : "error"}
                        className="min-w-[80px] justify-center">
                        {test.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Medicine Insight Section */}
          <React.Suspense fallback={<Loading />}>
            <MedicineInsight medicines={report.medicines} />
          </React.Suspense>
        </div>

        {/* AI Insight Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-primary-600 text-white border-none shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <CardBody className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black">AI Health Assistant</h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8 italic text-lg leading-relaxed font-semibold">
                "
                {i18n.language === "ne"
                  ? report.aiSummary.ne
                  : report.aiSummary.en}
                "
              </div>

              <Button
                variant="secondary"
                className="w-full py-6 rounded-2xl text-lg font-black text-primary-700 hover:scale-[1.02]"
                onClick={toggleVoice}>
                {isPlaying ? (
                  <Activity className="mr-3 w-6 h-6 animate-pulse" />
                ) : (
                  <Play className="mr-3 w-6 h-6 fill-primary-700" />
                )}
                {isPlaying ? "Speaking..." : "Listen to Report (बजाउनुहोस्)"}
              </Button>
            </CardBody>
          </Card>

          <Card className="border-none shadow-sm bg-success-50">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4 text-success-700">
                <Info className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold uppercase tracking-wider">
                  Lifestyle Suggestion
                </p>
              </div>
              <p className="text-sm text-success-900 font-medium leading-relaxed">
                Consume iron-rich foods like spinach, lentils, and pumpkin seeds
                during dinner. Avoid caffeine with meals as it inhibits iron
                absorption.
              </p>
            </CardBody>
          </Card>

          {/* Payment Partners */}
          <div className="p-6 rounded-3xl bg-gray-100 flex flex-col items-center gap-4">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
              Verified Secure Lab Partners
            </p>
            <div className="flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
              <img src="/esewa-logo.png" alt="eSewa" className="h-4" />
              <img src="/khalti-logo.png" alt="Khalti" className="h-4" />
              <img src="/ime-pay-logo.png" alt="IME Pay" className="h-5" />
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Results;
