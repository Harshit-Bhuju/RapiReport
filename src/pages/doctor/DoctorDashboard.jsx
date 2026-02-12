import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import chatService from "@/lib/chatService";
import { useHealthStore } from "@/store/healthStore";
import API from "@/Configs/ApiEndpoints";
import {
  Users,
  Activity,
  FileText,
  Wand2,
  ClipboardList,
  AlertTriangle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    { at: "2026-02-11", text: "BP reading 150/95 at home", severity: "moderate" },
  ],
  p2: [
    { at: "2026-02-09", text: "Fasting sugar 170 mg/dL", severity: "moderate" },
    { at: "2026-02-11", text: "Fatigue after meals", severity: "mild" },
  ],
  p3: [
    { at: "2026-02-11", text: "Itchy rash on arms", severity: "moderate" },
  ],
};

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
      )}
    >
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
  const [prescriptionStats, setPrescriptionStats] = useState(null);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [provisionalDx, setProvisionalDx] = useState("");
  const [aiDraft, setAiDraft] = useState("");

  const [asyncRequests, setAsyncRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, asyncRes, statsRes] = await Promise.all([
          axios.get(API.DOCTOR_PATIENTS, { withCredentials: true }),
          axios.get(API.ASYNC_CONSULT_LIST, { withCredentials: true }),
          axios.get(API.PRESCRIPTION_STATS, { withCredentials: true }),
        ]);
        if (pRes.data?.status === "success") {
          const pList = pRes.data.data || [];
          setPatients(pList);
          if (pList.length && !selectedId) setSelectedId(pList[0]?.id);
        }
        if (asyncRes.data?.status === "success" && Array.isArray(asyncRes.data.data)) {
          setAsyncRequests(asyncRes.data.data);
        }
        if (statsRes.data?.status === "success") {
          setPrescriptionStats(statsRes.data.data);
        }
      } catch (_) {}
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
      } catch (_) {}
    };
    fetchTimeline();
  }, [selectedId]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [patients, search]);

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
You are assisting a licensed doctor. Generate a SAFE, conservative prescription draft and clinical suggestions.

Return in this format:
1) Summary
2) Possible causes (brief)
3) Safety checks (allergies/interactions/red flags)
4) Suggested Rx draft (generic names, dose, frequency, duration) - KEEP IT SHORT
5) Patient instructions
6) When to refer / urgent warning signs

Patient:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Allergies: ${patient.allergies?.length ? patient.allergies.join(", ") : "None known"}
- Chronic conditions: ${patient.chronic?.length ? patient.chronic.join(", ") : "None"}
- Recent symptoms: ${timeline.filter((t) => t.type === "symptom").map((s) => `${s.at}: ${s.title}`).join(" | ") || "None"}

Chief complaint: ${chiefComplaint}
Provisional diagnosis: ${provisionalDx}

Important: Always include a disclaimer that AI suggestions must be verified by the doctor.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prescriptionStats && (
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{prescriptionStats.totalPrescriptions || 0}</p>
                  <p className="text-xs font-bold text-gray-500">Total prescriptions</p>
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
                  <p className="text-2xl font-black text-gray-900">{prescriptionStats.prescriptionsLast30Days || 0}</p>
                  <p className="text-xs font-bold text-gray-500">Last 30 days</p>
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
                  <p className="text-2xl font-black text-gray-900">{missedDoses}</p>
                  <p className="text-xs font-bold text-gray-500">Missed doses (7d)</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {prescriptionStats?.commonMedicines?.length > 0 && (
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <h2 className="text-lg font-black text-gray-900 mb-3">Most prescribed medicines</h2>
            <div className="space-y-2">
              {prescriptionStats.commonMedicines.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
                  <span className="font-bold text-gray-900">{m.name}</span>
                  <span className="text-sm text-gray-500">{m.count}x</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {asyncRequests.length > 0 && (
        <Card className="border-none shadow-xl shadow-gray-100/50 border-l-4 border-primary-500">
          <CardBody className="p-6">
            <h2 className="text-lg font-black text-gray-900 mb-3">Async consultation requests (telemedicine)</h2>
            <p className="text-sm text-gray-600 mb-4">Patients submitted symptoms/vitals for your review.</p>
            <div className="space-y-3">
              {asyncRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="p-4 rounded-xl border border-gray-100 bg-white">
                  <p className="font-bold text-gray-900">{req.patientName || "Patient"} • {req.patientEmail}</p>
                  <p className="text-sm text-gray-600 mt-1">{req.symptomsText || "—"}</p>
                  {req.dietActivityNote && <p className="text-xs text-gray-500 mt-1">Diet/activity: {req.dietActivityNote}</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(req.createdAt).toLocaleString()}</p>
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
                    )}
                  >
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

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Chronic
                  </p>
                  <p className="text-sm font-black text-gray-900 mt-1">
                    {patient?.chronic?.length ? patient.chronic.join(", ") : "—"}
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
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
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
                      className="p-4 rounded-2xl border border-gray-100 bg-white flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center",
                              item.type === "rx"
                                ? "bg-primary-50 text-primary-600"
                                : "bg-gray-100 text-gray-700",
                            )}
                          >
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
        title="AI-assisted prescription draft (MVP)"
        size="xl"
      >
        <div className="space-y-4">
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

          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleGenerateDraft}
              loading={aiLoading}
              className="gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Generate draft
            </Button>
            <Button variant="secondary" onClick={() => setIsAiOpen(false)}>
              Close
            </Button>
          </div>

          <textarea
            className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 transition-all min-h-[260px] resize-none text-sm"
            placeholder="AI draft will appear here…"
            value={aiDraft}
            onChange={(e) => setAiDraft(e.target.value)}
          />

          <p className="text-xs text-gray-400">
            Always verify before prescribing. This draft is AI-generated and may
            be incorrect.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;

