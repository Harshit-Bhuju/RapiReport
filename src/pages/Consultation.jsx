import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import ChatInterface from "@/components/features/ChatInterface";
import {
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";
import API from "@/Configs/ApiEndpoints";

const Consultation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const initialPrescription = location.state?.initialPrescription;
  const [asyncOpen, setAsyncOpen] = useState(false);
  const [symptomsText, setSymptomsText] = useState("");
  const [dietActivityNote, setDietActivityNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAsyncSubmit = async () => {
    if (!symptomsText.trim()) {
      toast.error("Describe your symptoms.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await axios.post(
        API.ASYNC_CONSULT_SUBMIT,
        { symptoms_text: symptomsText, diet_activity_note: dietActivityNote },
        { withCredentials: true },
      );
      if (r.data?.status === "success") {
        toast.success("Submitted. A doctor will review asynchronously.");
        setAsyncOpen(false);
        setSymptomsText("");
        setDietActivityNote("");
      } else {
        toast.error(r.data?.message || "Submit failed.");
      }
    } catch (e) {
      toast.error("Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <ChatInterface isFullPage initialPrescription={initialPrescription} />
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

          <Card className="border-none shadow-sm bg-success-50/50">
            <CardBody className="p-6">
              <h3 className="font-black text-gray-900 mb-2 text-sm">
                Async consult
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Submit symptoms and notes for a doctor to review. No live visit
                needed for non-urgent cases.
              </p>
              <Button
                size="sm"
                className="w-full gap-2"
                onClick={() => setAsyncOpen(true)}>
                <Send className="w-4 h-4" />
                Submit for doctor review
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={asyncOpen}
        onClose={() => setAsyncOpen(false)}
        title="Submit for doctor review">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Symptoms / reason
            </label>
            <textarea
              className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-primary-500 min-h-[100px] resize-none"
              value={symptomsText}
              onChange={(e) => setSymptomsText(e.target.value)}
              placeholder="Describe your symptoms or reason for consult..."
            />
          </div>
          <Input
            label="Diet / activity (optional)"
            value={dietActivityNote}
            onChange={(e) => setDietActivityNote(e.target.value)}
            placeholder="Recent diet, exercise, or relevant notes"
          />
          <Button
            onClick={handleAsyncSubmit}
            loading={submitting}
            className="w-full gap-2"
            disabled={!symptomsText.trim()}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Consultation;
