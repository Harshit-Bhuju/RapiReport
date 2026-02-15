import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useHealthStore } from "@/store/healthStore";
import API from "@/Configs/ApiEndpoints";
import { useConsultationStore } from "@/store/consultationStore";
import {
  FileText,
  Clock,
  Video,
  MessageSquare,
  Calendar,
  User,
  RefreshCw,
  DollarSign,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DirectChat from "@/components/features/DirectChat";
import { cn } from "@/lib/utils";
import DoctorProfessionalPrompt from "@/components/features/DoctorProfessionalPrompt";
import PatientHealthPanel from "@/components/features/PatientHealthPanel";
import { useAuthStore } from "@/store/authStore";

const DoctorDashboard = () => {
  const { prescriptions } = useHealthStore();
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const { setActiveCall } = useConsultationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [transactionStats, setTransactionStats] = useState(null);
  const [prescriptionStats, setPrescriptionStats] = useState(null);

  const [isHealthPanelOpen, setIsHealthPanelOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, aptRes, txRes] = await Promise.allSettled([
          axios.get(API.PRESCRIPTION_STATS, { withCredentials: true }),
          axios.get(API.DOCTOR_APPOINTMENTS, { withCredentials: true }),
          axios.get(API.DOCTOR_TRANSACTIONS, { withCredentials: true }),
        ]);

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

  const handleStartCall = (appointment) => {
    setActiveCall({ appointment, status: 'initiate' });
  };

  const handleMessage = (appointment) => {
    setSelectedChatUser({
      id: appointment.patient_user_id,
      name: appointment.patient_name,
      avatar: appointment.patient_profile_pic,
      appointmentId: appointment.id,
    });
    setIsChatOpen(true);
  };

  const handleViewHealth = (appointment) => {
    setSelectedPatient({
      id: appointment.patient_user_id,
      name: appointment.patient_name,
    });
    setIsHealthPanelOpen(true);
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
            Manage your appointments and view your schedule.
          </p>
        </div>
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
                      <div className="flex flex-col gap-4">
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
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors truncate">{apt.patient_name}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(apt.appointment_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                                <Clock className="w-3 h-3" />
                                {apt.appointment_time_slot}
                              </div>
                              {apt.payment_status && (
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border",
                                  apt.payment_status === 'completed' ? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"
                                )}>
                                  {apt.payment_status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-50">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"
                            onClick={() => handleMessage(apt)}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 border-primary-200 text-primary-600 hover:bg-primary-50"
                            onClick={() => handleViewHealth(apt)}
                          >
                            <Activity className="w-3.5 h-3.5" />
                            Records
                          </Button>
                          <Button
                            size="sm"
                            className={cn(
                              "flex-1 h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm",
                              apt.status !== 'confirmed' && "opacity-50 grayscale cursor-not-allowed"
                            )}
                            disabled={apt.status !== 'confirmed'}
                            onClick={() => handleStartCall(apt)}
                          >
                            <Video className="w-3.5 h-3.5" />
                            Join Call
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

        <Card className="lg:col-span-1 border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              My Weekly Schedule
            </h2>
            <div className="space-y-3">
              {(() => {
                const availability = user?.doctorProfile?.availability_json || [];
                const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

                if (availability.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400 italic font-medium bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                      No schedule set. Update your profile.
                    </div>
                  );
                }

                return days.map(day => {
                  const slot = availability.find(s => s.day === day);
                  const isActiveToday = day === today;

                  return (
                    <div key={day} className={cn(
                      "flex justify-between items-center p-3 rounded-xl border transition-all",
                      isActiveToday
                        ? "bg-primary-50 border-primary-200 shadow-sm"
                        : "bg-white border-gray-100"
                    )}>
                      <div className="flex flex-col">
                        <span className={cn("text-xs font-black uppercase tracking-wider", isActiveToday ? "text-primary-700" : "text-gray-500")}>
                          {day}
                        </span>
                        {isActiveToday && <span className="text-[8px] font-black text-primary-500 uppercase tracking-widest">Active Today</span>}
                      </div>
                      {slot ? (
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-black border",
                          isActiveToday ? "bg-white border-primary-200 text-primary-700" : "bg-gray-50 border-gray-100 text-gray-600"
                        )}>
                          {slot.startTime} - {slot.endTime}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase italic">Not Available</span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            <Button
              variant="outline"
              className="w-full mt-6 text-xs font-black uppercase tracking-widest"
              onClick={() => navigate("/doctor-profile")}
            >
              Update Schedule
            </Button>
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

      {isChatOpen && selectedChatUser && (
        <DirectChat
          recipientId={selectedChatUser.id}
          recipientName={selectedChatUser.name}
          recipientAvatar={selectedChatUser.avatar}
          appointmentId={selectedChatUser.appointmentId}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {isHealthPanelOpen && selectedPatient && (
        <PatientHealthPanel
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          isOpen={isHealthPanelOpen}
          onClose={() => setIsHealthPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
