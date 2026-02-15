import React, { useState, useEffect } from "react";
import API from "@/Configs/ApiEndpoints";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Calendar, Clock, Video, MessageSquare, User, RefreshCw, Phone, Ban, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DirectChat from "@/components/features/DirectChat";
import PatientHealthPanel from "@/components/features/PatientHealthPanel";
import { useConsultationStore } from "@/store/consultationStore";
import { useAuthStore } from "@/store/authStore";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";


const DoctorAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { setActiveCall } = useConsultationStore();

    // Chat state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedChatUser, setSelectedChatUser] = useState(null);

    // Health panel state
    const [isHealthPanelOpen, setIsHealthPanelOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Schedule state
    const { user, checkAuth } = useAuthStore();
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [availability, setAvailability] = useState([]);
    const [savingSchedule, setSavingSchedule] = useState(false);

    useEffect(() => {
        fetchAppointments();
        if (user?.doctorProfile?.availability_json) {
            setAvailability(user.doctorProfile.availability_json);
        }
    }, [user]);

    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
        try {
            const res = await axios.post(
                API.DOCTOR_AVAILABILITY,
                { availability },
                { withCredentials: true }
            );

            if (res.data.status === "success") {
                toast.success("Schedule updated successfully!");
                await checkAuth(); // Refresh user data to get new availability
                setIsScheduleOpen(false);
            } else {
                toast.error(res.data.message || "Failed to update schedule");
            }
        } catch (error) {
            console.error("Error saving schedule:", error);
            toast.error("An error occurred while saving schedule.");
        } finally {
            setSavingSchedule(false);
        }
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API.DOCTOR_APPOINTMENTS, { withCredentials: true });
            if (res.data.status === "success") {
                setAppointments(res.data.appointments);
            }
        } catch (error) {
            console.error("Error fetching doctor appointments:", error);
            toast.error("Failed to load appointments.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartCall = (appointment) => {
        const roomId = `ROOM-${appointment.id}`;
        setActiveCall({
            appointment: {
                ...appointment,
                patient_name: appointment.patient_name,
                patient_avatar: appointment.patient_profile_pic,
                doctor_user_id: appointment.doctor_user_id,
                patient_user_id: appointment.patient_user_id,
                room_id: roomId
            },
            status: 'initiate'
        });
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

    // Show all appointments (sorted by date/time from backend)
    const displayAppointments = appointments;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">My Appointments</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage your upcoming consultations</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsScheduleOpen(true)}>
                        <Clock className="w-4 h-4 mr-2" /> Manage Schedule
                    </Button>
                    <Button variant="outline" onClick={fetchAppointments}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading appointments...</div>
            ) : displayAppointments.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200 shadow-none">
                    <CardBody className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                        <Calendar className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-bold">No appointments found.</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {displayAppointments.map((apt) => {
                        const canCall = apt.status === 'confirmed';

                        return (
                            <Card key={apt.id} className="border-none shadow-lg shadow-gray-100/50 overflow-hidden">
                                <CardBody className="p-0 flex flex-col md:flex-row">
                                    <div className="p-6 bg-primary-50 md:w-1/4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-primary-100">
                                        <div className="w-16 h-16 rounded-2xl bg-white mb-3 overflow-hidden border-2 border-primary-100 shadow-sm">
                                            {apt.patient_profile_pic ? (
                                                <img src={apt.patient_profile_pic} alt={apt.patient_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8 text-gray-400 m-auto mt-4" />
                                            )}
                                        </div>
                                        <h3 className="font-black text-primary-900 leading-tight">{apt.patient_name}</h3>
                                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-1">Patient Profile</span>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                                    apt.status === 'confirmed' ? "bg-success-50 text-success-700 border-success-100" :
                                                        apt.status === 'pending' ? "bg-warning-50 text-warning-700 border-warning-100" :
                                                            "bg-gray-50 text-gray-500 border-gray-100"
                                                )}>
                                                    {apt.status}
                                                </span>
                                                {apt.payment_status && (
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                                        apt.payment_status === 'completed' ? "bg-green-50 text-green-700 border-green-100" :
                                                            "bg-yellow-50 text-yellow-700 border-yellow-100"
                                                    )}>
                                                        {apt.payment_status}
                                                    </span>
                                                )}
                                                {apt.amount && (
                                                    <span className="ml-auto text-sm font-black text-gray-900">
                                                        Rs. {apt.amount}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-bold text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                        <Calendar className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Date</p>
                                                        <p>{new Date(apt.appointment_date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Time Slot</p>
                                                        <p>{apt.appointment_time_slot}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 min-w-[120px] h-10 gap-2 text-[10px] font-black uppercase tracking-widest"
                                                onClick={() => handleMessage(apt)}
                                            >
                                                <MessageSquare className="w-4 h-4" /> Message
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 min-w-[120px] h-10 gap-2 border-primary-200 text-primary-600 hover:bg-primary-50 text-[10px] font-black uppercase tracking-widest"
                                                onClick={() => handleViewHealth(apt)}
                                            >
                                                <Activity className="w-4 h-4" /> Records
                                            </Button>
                                            {canCall ? (
                                                <Button
                                                    size="sm"
                                                    className="flex-1 min-w-[120px] h-10 gap-2 bg-success-600 hover:bg-success-700 text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-success-100"
                                                    onClick={() => handleStartCall(apt)}
                                                >
                                                    <Phone className="w-4 h-4" /> Join Call
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    className="flex-1 min-w-[120px] h-10 gap-2 opacity-50 cursor-not-allowed text-[10px] font-black uppercase tracking-widest"
                                                    disabled
                                                >
                                                    <Ban className="w-4 h-4" /> On Hold
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
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

            <Modal
                isOpen={isScheduleOpen}
                onClose={() => setIsScheduleOpen(false)}
                title="Availability Settings"
                size="lg"
            >
                <div>
                    <p className="text-sm text-gray-500 mb-6">
                        Set your weekly availability for consultations. Patients can only book slots within these times.
                    </p>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                            <div key={day} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                <div className="w-24 font-bold text-sm text-gray-700">{day}</div>
                                <select
                                    className="p-2 border rounded-lg text-sm bg-white focus:ring-primary-500 focus:border-primary-500"
                                    value={availability.find(s => s.day === day)?.startTime || "09:00"}
                                    onChange={(e) => {
                                        const newAv = [...availability];
                                        const idx = newAv.findIndex(s => s.day === day);
                                        if (idx >= 0) newAv[idx].startTime = e.target.value;
                                        else newAv.push({ day, startTime: e.target.value, endTime: "17:00" });
                                        setAvailability(newAv);
                                    }}
                                >
                                    <option value="09:00">09:00 AM</option>
                                    <option value="10:00">10:00 AM</option>
                                    <option value="11:00">11:00 AM</option>
                                    <option value="12:00">12:00 PM</option>
                                    <option value="13:00">01:00 PM</option>
                                </select>
                                <span className="text-gray-400 font-bold">-</span>
                                <select
                                    className="p-2 border rounded-lg text-sm bg-white focus:ring-primary-500 focus:border-primary-500"
                                    value={availability.find(s => s.day === day)?.endTime || "17:00"}
                                    onChange={(e) => {
                                        const newAv = [...availability];
                                        const idx = newAv.findIndex(s => s.day === day);
                                        if (idx >= 0) newAv[idx].endTime = e.target.value;
                                        else newAv.push({ day, startTime: "09:00", endTime: e.target.value });
                                        setAvailability(newAv);
                                    }}
                                >
                                    <option value="12:00">12:00 PM</option>
                                    <option value="13:00">01:00 PM</option>
                                    <option value="14:00">02:00 PM</option>
                                    <option value="15:00">03:00 PM</option>
                                    <option value="16:00">04:00 PM</option>
                                    <option value="17:00">05:00 PM</option>
                                    <option value="18:00">06:00 PM</option>
                                </select>
                                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer ml-auto">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                                        checked={!!availability.find(s => s.day === day)}
                                        onChange={(e) => {
                                            let newAv = [...availability];
                                            if (e.target.checked) {
                                                if (!newAv.find(s => s.day === day)) {
                                                    newAv.push({ day, startTime: "09:00", endTime: "17:00" });
                                                }
                                            } else {
                                                newAv = newAv.filter(s => s.day !== day);
                                            }
                                            setAvailability(newAv);
                                        }}
                                    />
                                    <span className={availability.find(s => s.day === day) ? "text-primary-600" : "text-gray-400"}>Active</span>
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <Button variant="ghost" onClick={() => setIsScheduleOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveSchedule}
                            loading={savingSchedule}
                            className="bg-primary-600 hover:bg-primary-700 text-white"
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DoctorAppointments;
