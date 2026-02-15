import React, { useState, useEffect } from "react";
import API from "@/Configs/ApiEndpoints";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Calendar, Clock, Video, MessageSquare, User, RefreshCw, Phone, Ban } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DirectChat from "@/components/features/DirectChat";
import { useConsultationStore } from "@/store/consultationStore";

const DoctorAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { setActiveCall } = useConsultationStore();

    // Chat state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedChatUser, setSelectedChatUser] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

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

    // Show all appointments (sorted by date/time from backend)
    const displayAppointments = appointments;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">My Appointments</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage your upcoming consultations</p>
                </div>
                <Button variant="outline" onClick={fetchAppointments}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
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
                                        <div className="w-16 h-16 rounded-full bg-white mb-3 overflow-hidden border-2 border-primary-200">
                                            {apt.patient_profile_pic ? (
                                                <img src={apt.patient_profile_pic} alt={apt.patient_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8 text-gray-400 m-auto mt-4" />
                                            )}
                                        </div>
                                        <h3 className="font-black text-primary-900">{apt.patient_name}</h3>
                                        <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">Patient</p>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${apt.status === 'confirmed' ? 'bg-success-100 text-success-700' :
                                                        apt.status === 'pending' ? 'bg-warning-100 text-warning-700' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {apt.status}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${apt.payment_status === 'completed'
                                                            ? 'bg-success-100 text-success-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {apt.payment_status || 'Pending'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(apt.appointment_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {apt.appointment_time_slot}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                                            <Button
                                                variant="secondary"
                                                className="flex-1 gap-2"
                                                onClick={() => handleMessage(apt)}
                                            >
                                                <MessageSquare className="w-4 h-4" /> Message
                                            </Button>
                                            {canCall ? (
                                                <Button
                                                    className="flex-1 gap-2 bg-success-600 hover:bg-success-700 text-white"
                                                    onClick={() => handleStartCall(apt)}
                                                >
                                                    <Phone className="w-4 h-4" /> Start Call
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="flex-1 gap-2 opacity-50 cursor-not-allowed"
                                                    disabled
                                                >
                                                    <Ban className="w-4 h-4" /> Not Confirmed
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
        </div>
    );
};

export default DoctorAppointments;
