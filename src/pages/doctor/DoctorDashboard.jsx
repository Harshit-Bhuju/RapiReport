import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import chatService from "@/lib/chatService";
import { useHealthStore } from "@/store/healthStore";
import API from "@/Configs/ApiEndpoints";
import { useConsultationStore } from "@/store/consultationStore";
import {
  Users,
  Activity,
  FileText,
  Wand2,
  ClipboardList,
  AlertTriangle,
  Search,
  Clock,
  Heart,
  Droplets,
  Thermometer,
  Zap,
  Video,
  MessageSquare,
  Calendar,
  User,
  Plus,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DirectChat from "@/components/features/DirectChat";
import { cn } from "@/lib/utils";
import DoctorProfessionalPrompt from "@/components/features/DoctorProfessionalPrompt";

// MVP mock patients (replace with backend later)
const MOCK_PATIENTS = [
  {
    id: "p1",
    name: "Sita Shrestha",
    age: 42,
    gender: "Female",
    allergies: ["Penicillin"],
    chronic: ["BP"],
    notes: "Reports dizziness occasionally.",
  },
  {
    id: "p2",
    name: "Ramesh Karki",
    age: 55,
    gender: "Male",
    allergies: [],
    chronic: ["Diabetes"],
    notes: "Diet adherence inconsistent.",
  },
  {
    id: "p3",
    name: "Asha Gurung",
    age: 28,
    gender: "Female",
    allergies: ["NSAIDs"],
    chronic: [],
    notes: "Skin rash after new soap; itching.",
  },
];

const MOCK_SYMPTOMS = {
  p1: [
    { at: "2026-02-10", text: "Headache + mild dizziness", severity: "mild" },
    {
      at: "2026-02-11",
      text: "BP reading 150/95 at home",
      severity: "moderate",
    },
  ],
  p2: [
    { at: "2026-02-09", text: "Fasting sugar 170 mg/dL", severity: "moderate" },
    { at: "2026-02-11", text: "Fatigue after meals", severity: "mild" },
  ],
  p3: [{ at: "2026-02-11", text: "Itchy rash on arms", severity: "moderate" }],
};


const MOCK_VITALS = [
  {
    title: "Heart Rate",
    value: "72",
    unit: "bpm",
    trend: "stable",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    title: "Blood Pressure",
    value: "120/80",
    unit: "mmHg",
    trend: "up",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "SpO2",
    value: "98",
    unit: "%",
    trend: "stable",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    title: "Glucose",
    value: "95",
    unit: "mg/dL",
    trend: "down",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
];

function severityBadge(sev) {
  const styles = {
    mild: "bg-success-50 text-success-700 border-success-100",
    moderate: "bg-warning-50 text-warning-700 border-warning-100",
    severe: "bg-error-50 text-error-700 border-error-100",
  };
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-[11px] font-black border capitalize",
        styles[sev] || "bg-gray-50 text-gray-600 border-gray-100",
      )}>
      {sev}
    </span>
  );
}

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [missedDoses, setMissedDoses] = useState(0);
  const [transactionStats, setTransactionStats] = useState(null);
  const [prescriptionStats, setPrescriptionStats] = useState(null);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [provisionalDx, setProvisionalDx] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState([
    { name: "", dose: "", frequency: "", duration: "" },
  ]);

  const { prescriptions } = useHealthStore();
  const [asyncRequests, setAsyncRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const { setActiveCall } = useConsultationStore();
  const navigate = useNavigate();

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, asyncRes, statsRes, aptRes, txRes] = await Promise.allSettled([
          axios.get(API.DOCTOR_PATIENTS, { withCredentials: true }),
          axios.get(API.ASYNC_CONSULT_LIST, { withCredentials: true }),
          axios.get(API.PRESCRIPTION_STATS, { withCredentials: true }),
          axios.get(API.DOCTOR_APPOINTMENTS, { withCredentials: true }),
          axios.get(API.DOCTOR_TRANSACTIONS, { withCredentials: true }),
        ]);

        if (pRes.status === "fulfilled" && pRes.value.data?.status === "success") {
          const pList = pRes.value.data.data || [];
          setPatients(pList);
          if (pList.length && !selectedId) setSelectedId(pList[0]?.id);
        }
        if (asyncRes.status === "fulfilled" && asyncRes.value.data?.status === "success" && Array.isArray(asyncRes.value.data.data)) {
          setAsyncRequests(asyncRes.value.data.data);
        }
        if (statsRes.status === "fulfilled" && statsRes.value.data?.status === "success") {
          setPrescriptionStats(statsRes.value.data.data);
        }
        if (aptRes.status === "fulfilled" && aptRes.value.data?.status === "success") {
          setAppointments(aptRes.value.data.appointments || []);
        } else {
          console.error("Appointments fetch failed:", aptRes.status === "rejected" ? aptRes.reason : aptRes.value?.data);
        }
        if (txRes.status === "fulfilled" && txRes.value.data?.status === "success") {
          setTransactionStats(txRes.value.data.stats);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const fetchTimeline = async () => {
      try {
        const r = await axios.get(API.DOCTOR_PATIENT_TIMELINE, {
          params: { patient_id: selectedId },
          withCredentials: true,
        });
        if (r.data?.status === "success") {
          setTimeline(r.data.timeline || []);
          setMissedDoses(r.data.missedDosesLast7Days || 0);
        }
      } catch (_) { }
    };
    fetchTimeline();
  }, [selectedId]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [patients, search]);

  const handleAddItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { name: "", dose: "", frequency: "", duration: "" },
    ]);
  };

  const handleRemoveItem = (index) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...prescriptionItems];
    newItems[index][field] = value;
    setPrescriptionItems(newItems);
  };

  const handleSavePrescription = async () => {
    if (!selectedId) {
      toast.error("Please select a patient first.");
      return;
    }

    try {
      const response = await axios.post(
        API.SAVE_PRESCRIPTION,
        {
          patient_id: selectedId,
          chief_complaint: chiefComplaint,
          provisional_dx: provisionalDx,
          medicines: prescriptionItems.filter((m) => m.name.trim() !== ""),
        },
        { withCredentials: true },
      );

      if (response.data?.status === "success") {
        toast.success("Prescription saved successfully!");
        setIsAiOpen(false);
        // Reset state
        setPrescriptionItems([
          { name: "", dose: "", frequency: "", duration: "" },
        ]);
        setChiefComplaint("");
        setProvisionalDx("");
      } else {
        toast.error(response.data?.message || "Failed to save prescription.");
      }
    } catch (err) {
      toast.error("Error saving prescription. Check console.");
      console.error(err);
    }
  };

  const handleStartCall = (appointment) => {
    setActiveCall({ appointment, status: 'initiate' });
  };

  const handleMessage = (appointment) => {
    setSelectedChatUser({
      id: appointment.patient_user_id,
      name: appointment.patient_name,
      avatar: appointment.patient_profile_pic,
    });
    setIsChatOpen(true);
  };

  const patient = useMemo(
    () => patients.find((p) => p.id === selectedId) || patients[0],
    [patients, selectedId],
  );

  const handleGenerateDraft = async () => {
    if (!patient) return;
    if (!chiefComplaint.trim() && !provisionalDx.trim()) {
      toast.error("Add a complaint or a diagnosis for better results.");
      return;
    }

    setAiLoading(true);
    try {
      const prompt = `
You are assisting a licensed doctor. Generate a SAFE, conservative prescription draft.
Return exactly three sections:
1) CLINICAL_SUMMARY: Patient status and safety checks.
2) MEDICINES_JSON: A JSON array of objects with keys: "name", "dose", "frequency", "duration".
3) PATIENT_INSTRUCTIONS: Advice and when to refer.

Patient:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Chronic: ${patient.chronic?.join(", ") || "None"}
- Allergies: ${patient.allergies?.join(", ") || "None"}

Clinical Info:
- Chief Complaint: ${chiefComplaint}
- Provisional Dx: ${provisionalDx}
`;

      const res = await chatService.sendMessage(prompt, "en");
      const text = res?.text?.en || "";
      setAiDraft(text);
      toast.success("AI draft generated.");
    } catch (e) {
      toast.error("AI generation failed. Check API key/model.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <DoctorProfessionalPrompt />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Doctor Dashboard
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Patient timeline + AI-assisted prescription draft (MVP)
          </p>
        </div>
        <Button onClick={() => setIsAiOpen(true)} className="gap-2">
          <Wand2 className="w-4 h-4" />
          AI Draft Prescription
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {transactionStats && (
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">
                    Rs. {transactionStats.total_earnings || 0}
                  </p>
                  <p className="text-xs font-bold text-gray-500">
                    Total Earnings
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
        {prescriptionStats && (
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">
                    {prescriptionStats.totalPrescriptions || 0}
                  </p>
                  <p className="text-xs font-bold text-gray-500">
                    Total prescriptions
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
        {prescriptionStats && (
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">
                    {prescriptionStats.prescriptionsLast30Days || 0}
                  </p>
                  <p className="text-xs font-bold text-gray-500">
                    Last 30 days
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
        {patient && missedDoses > 0 && (
          <Card className="border-none shadow-xl shadow-gray-100/50 border-l-4 border-error-500">
            <CardBody className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-error-50 flex items-center justify-center text-error-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">
                    {missedDoses}
                  </p>
                  <p className="text-xs font-bold text-gray-500">
                    Missed doses (7d)
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Quick Actions & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50 overflow-hidden">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Upcoming Appointments</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Next 48 Hours</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/doctor-appointments")} className="text-primary-600 font-bold">
                  View All
                </Button>
              </div>

              {appointmentsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                  <p className="font-bold">Syncing schedules...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                  <Calendar className="w-12 h-12 mb-4 opacity-30" />
                  <p className="font-bold">No upcoming appointments found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="group p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/20 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 group-hover:border-primary-100 transition-colors">
                            {apt.patient_profile_pic ? (
                              <img src={apt.patient_profile_pic} alt={apt.patient_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <User className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">{apt.patient_name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(apt.appointment_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                                <Clock className="w-3 h-3" />
                                {apt.appointment_time_slot}
                              </div>
                              {apt.amount && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                  <DollarSign className="w-3 h-3 text-green-600" />
                                  Rs. {apt.amount}
                                  <span className={cn(
                                    "ml-1 px-1.5 rounded-full text-[8px] uppercase tracking-tighter",
                                    apt.payment_status === 'completed' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                  )}>
                                    {apt.payment_status}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 sm:flex-none h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"
                            onClick={() => handleMessage(apt)}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message
                          </Button>
                          <Button
                            size="sm"
                            className={cn(
                              "flex-1 sm:flex-none h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm",
                              apt.status !== 'confirmed' && "opacity-50 grayscale cursor-not-allowed"
                            )}
                            disabled={apt.status !== 'confirmed'}
                            onClick={() => handleStartCall(apt)}
                          >
                            <Video className="w-3.5 h-3.5" />
                            Start Call
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <Card className="lg:col-span-1 border-none shadow-xl shadow-gray-100/50 bg-gray-900 text-white">
          <CardBody className="p-6">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-warning-400">
              <Zap className="w-5 h-5" />
              Quick Templates
            </h2>
            <div className="space-y-4">
              <button className="w-full p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group">
                <p className="font-black text-sm mb-1 group-hover:text-warning-400 tracking-tight">
                  Common Cold/URTI
                </p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Saline, Antipyretic, Rest
                </p>
              </button>
              <button className="w-full p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group">
                <p className="font-black text-sm mb-1 group-hover:text-warning-400 tracking-tight">
                  Hypertension F/U
                </p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Amlodipine, Low Salt
                </p>
              </button>
              <button className="w-full p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group">
                <p className="font-black text-sm mb-1 group-hover:text-warning-400 tracking-tight">
                  Diabetes Check
                </p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Metformin, HbA1c Test
                </p>
              </button>
            </div>
          </CardBody>
        </Card>
      </div>

      {prescriptionStats?.commonMedicines?.length > 0 && (
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <h2 className="text-lg font-black text-gray-900 mb-3">
              Most prescribed medicines
            </h2>
            <div className="space-y-2">
              {prescriptionStats.commonMedicines.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
                  <span className="font-bold text-gray-900">{m.name}</span>
                  <span className="text-sm text-gray-500">{m.count}x</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient list */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">Patients</p>
                  <p className="text-xs text-gray-400 font-medium">
                    {patients.length} patient{patients.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="input pl-10"
                  placeholder="Search patients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-2xl border transition-all",
                      p.id === patient?.id
                        ? "bg-primary-50 border-primary-200"
                        : "bg-white border-gray-100 hover:bg-gray-50",
                    )}>
                    <p className="font-black text-gray-900 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {p.age} • {p.gender} •{" "}
                      {p.chronic?.length ? p.chronic.join(", ") : "No chronic"}
                    </p>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Patient detail + timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {patient?.name}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    {patient?.age} years • {patient?.gender}
                  </p>
                </div>
                {(patient?.allergies?.length || 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-error-50 border border-error-100 text-error-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-black">
                      Allergies: {patient.allergies.join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Health Snapshot Vitals */}
              <div className="mt-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                  Patient Health Snapshot (Real-time)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {MOCK_VITALS.map((v, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-4 rounded-2xl border border-gray-100 transition-all hover:shadow-md",
                        v.bg,
                      )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                          {v.title}
                        </span>
                        {v.trend === "up" ? (
                          <Activity className="w-3 h-3 text-error-500" />
                        ) : v.trend === "down" ? (
                          <Activity className="w-3 h-3 text-primary-500 rotate-180" />
                        ) : (
                          <Activity className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-xl font-black", v.color)}>
                          {v.value}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          {v.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Chronic
                  </p>
                  <p className="text-sm font-black text-gray-900 mt-1">
                    {patient?.chronic?.length
                      ? patient.chronic.join(", ")
                      : "—"}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Recent Symptoms
                  </p>
                  <p className="text-sm font-black text-gray-900 mt-1">
                    {timeline.filter((t) => t.type === "symptom").length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-gray-100 bg-white xs:col-span-2 sm:col-span-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Rx (local)
                  </p>
                  <p className="text-sm font-black text-gray-900 mt-1">
                    {prescriptions.length}
                  </p>
                </div>
              </div>

              {patient?.notes && (
                <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Notes
                  </p>
                  <p className="text-sm text-gray-700 font-medium mt-1">
                    {patient.notes}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Patient timeline
                </h2>
              </div>

              {timeline.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium">
                  No timeline entries yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-gray-100 bg-white flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center",
                              item.type === "rx"
                                ? "bg-primary-50 text-primary-600"
                                : "bg-gray-100 text-gray-700",
                            )}>
                            {item.type === "rx" ? (
                              <ClipboardList className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <p className="font-black text-gray-900 truncate">
                            {item.title}
                          </p>
                          {item.severity && severityBadge(item.severity)}
                        </div>
                        {item.detail && (
                          <p className="text-xs text-gray-500 font-medium mt-2">
                            {item.detail}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-bold shrink-0">
                        {new Date(item.at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-4">
                MVP: timeline uses mock symptoms + last few locally saved
                prescriptions. Next: real patient-linked history from backend.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        title="Advanced Prescription TUI"
        size="xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Chief complaint"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. fever + cough 3 days"
            />
            <Input
              label="Provisional diagnosis"
              value={provisionalDx}
              onChange={(e) => setProvisionalDx(e.target.value)}
              placeholder="e.g. URTI"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Prescribed Medicines
              </h3>
              <Button
                size="sm"
                onClick={handleAddItem}
                variant="outline"
                className="h-8">
                <Activity className="w-3.5 h-3.5 mr-1" />
                Add medicine
              </Button>
            </div>

            <div className="space-y-3">
              {prescriptionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Medicine name (e.g. Paracetamol)"
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateItem(idx, "name", e.target.value)
                        }
                        className="bg-white border-none shadow-sm h-10"
                      />
                    </div>
                    {prescriptionItems.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 text-error-500 hover:bg-error-50 rounded-lg transition-colors">
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      placeholder="Dose (e.g. 500mg)"
                      value={item.dose}
                      onChange={(e) =>
                        handleUpdateItem(idx, "dose", e.target.value)
                      }
                      className="bg-white border-none shadow-sm h-10 text-xs"
                    />
                    <Input
                      placeholder="Freq (e.g. 1-0-1)"
                      value={item.frequency}
                      onChange={(e) =>
                        handleUpdateItem(idx, "frequency", e.target.value)
                      }
                      className="bg-white border-none shadow-sm h-10 text-xs"
                    />
                    <Input
                      placeholder="Dur (e.g. 5 days)"
                      value={item.duration}
                      onChange={(e) =>
                        handleUpdateItem(idx, "duration", e.target.value)
                      }
                      className="bg-white border-none shadow-sm h-10 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Button
              onClick={handleGenerateDraft}
              loading={aiLoading}
              variant="outline"
              className="gap-2">
              <Wand2 className="w-4 h-4" />
              Fill with AI
            </Button>
            <Button onClick={handleSavePrescription}>Save Prescription</Button>
            <Button variant="ghost" onClick={() => setIsAiOpen(false)}>
              Cancel
            </Button>
          </div>

          <p className="text-[10px] text-gray-400 text-center italic">
            This TUI allows structured drafting. AI assists in filling fields
            based on complaints. Always verify before finalizing.
          </p>
        </div>
      </Modal>

      {isChatOpen && selectedChatUser && (
        <DirectChat
          recipientId={selectedChatUser.id}
          recipientName={selectedChatUser.name}
          recipientAvatar={selectedChatUser.avatar}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
