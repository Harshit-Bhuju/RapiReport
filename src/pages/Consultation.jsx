import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import ChatInterface from "@/components/features/ChatInterface";
import { MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";

const Consultation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const initialPrescription = location.state?.initialPrescription;
  const initialSymptom = location.state?.initialSymptom;
  const fromSymptoms = location.state?.fromSymptoms === true;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-primary-600" />
          {t("consultation.title")}
        </h1>
        <p className="text-gray-500 font-bold mt-1 text-sm">
          {t("consultation.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Chat Main Area */}
        <div className="lg:col-span-3 min-h-0 flex flex-col border border-gray-100 rounded-[2rem] bg-white shadow-sm overflow-hidden">
          <ChatInterface
          isFullPage
          initialPrescription={initialPrescription}
          initialSymptom={initialSymptom}
          fromSymptoms={fromSymptoms}
        />
        </div>

        {/* Sidebar Info */}
        <div className="hidden lg:block space-y-6 overflow-y-auto">
          <Card className="border-none shadow-sm bg-primary-50">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h3 className="font-black text-primary-900">
                  {t("consultation.capabilities")}
                </h3>
              </div>
              <ul className="space-y-3">
                {[
                  t("consultation.reportAnalysis"),
                  t("consultation.medicineGuidance"),
                  t("consultation.symptomChecking"),
                  t("consultation.bilingualSupport"),
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs font-bold text-primary-700 bg-white/50 px-3 py-2 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card className="border-none shadow-sm">
            <CardBody className="p-6">
              <h3 className="font-black text-gray-900 mb-4 text-sm">
                {t("consultation.safeUsage")}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                {t("consultation.safeUsageDesc")}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
