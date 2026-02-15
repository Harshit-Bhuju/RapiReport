import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Stethoscope,
  Phone,
  Video,
  MessageSquare,
  Clock,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";

const DoctorConsultation = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [credits, setCredits] = useState(0); // Mock credits
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const doctors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "General Physician",
      experience: "8 years",
      rate: 500,
      image:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
      status: "Online",
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Cardiologist",
      experience: "12 years",
      rate: 800,
      image:
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
      status: "Busy",
    },
    {
      id: 3,
      name: "Dr. Emily Williams",
      specialty: "Dermatologist",
      experience: "6 years",
      rate: 600,
      image:
        "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300",
      status: "Online",
    },
  ];

  const handleConsultClick = (doctor) => {
    setSelectedDoctor(doctor);
    if (credits < doctor.rate) {
      setShowPaymentModal(true);
    } else {
      // Proceed to consultation (mock)
      toast.success(`Connecting with ${doctor.name}...`);
    }
  };

  const handleAddCredits = () => {
    // Mock payment processing
    setTimeout(() => {
      setCredits((prev) => prev + 1000);
      setShowPaymentModal(false);
      toast.success("Credits added successfully!");
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-primary-600" />
            {t("doctors.title")}
          </h1>
          <p className="text-gray-500 font-bold mt-2">
            {t("doctors.subtitle")}
          </p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {t("doctors.credits")}
            </p>
            <p className="text-2xl font-black text-primary-600">
              Rs. {credits}
            </p>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="p-3 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors">
            <CreditCard className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <Card
            key={doctor.id}
            className="hover:-translate-y-1 transition-all duration-300">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-md"
                  />
                  <span
                    className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-white ${doctor.status === "Online"
                      ? "bg-success-100 text-success-700"
                      : "bg-warning-100 text-warning-700"
                      }`}>
                    {doctor.status}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-black text-gray-900 mb-1">
                  {doctor.name}
                </h3>
                <p className="text-sm font-medium text-primary-600 mb-2">
                  {doctor.specialty}
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {doctor.experience} {t("doctors.exp")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t("doctors.availableNow")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("doctors.consultFee")}
                  </span>
                  <span className="text-lg font-black text-gray-900">
                    Rs. {doctor.rate}
                  </span>
                </div>
                <button
                  onClick={() => handleConsultClick(doctor)}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2">
                  {t("doctors.consult")}
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600">
                <CreditCard className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                {t("doctors.addCredits")}
              </h2>
              <p className="text-gray-500 font-medium">
                {t("doctors.needMore")}{" "}
                <span className="text-gray-900 font-bold">
                  Rs. {selectedDoctor ? selectedDoctor.rate - credits : 500}
                </span>{" "}
                {t("doctors.moreToProceed")}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <button
                onClick={handleAddCredits}
                className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
                {t("doctors.addContinue")}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                {t("doctors.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorConsultation;
