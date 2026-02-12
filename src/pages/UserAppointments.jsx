import React, { useState, useEffect } from "react";
import API from "@/Configs/ApiEndpoints";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Calendar, Clock, Video, MessageSquare, AlertCircle, ShieldCheck, User, Phone, Ban } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DirectChat from "@/components/features/DirectChat";
import { useConsultationStore } from "@/store/consultationStore";

const UserAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Chat state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedChatUser, setSelectedChatUser] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await axios.get(API.USER_APPOINTMENTS, { withCredentials: true });
            if (res.data.status === "success") {
                setAppointments(Array.isArray(res.data.appointments) ? res.data.appointments : []);
            } else {
                setAppointments([]);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
            toast.error("Failed to load appointments.");
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = (appointment) => {
        setSelectedChatUser({
            id: appointment.other_user_id,
            name: appointment.display_name,
            avatar: appointment.profile_pic
        });
        setIsChatOpen(true);
    };

    // Show all appointments (sorted by date/time from backend)
    const displayAppointments = appointments;

    if (loading) return <div className="p-8 text-center">Loading appointments...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <div className="p-1.5 bg-primary-600 rounded-lg shadow-lg shadow-primary-200">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        My Appointments
                    </h1>
                    <p className="text-gray-500 font-bold mt-1 ml-1 text-[11px]">Manage consultations</p>
                </div>
            </div>

            {displayAppointments.length === 0 ? (
                <Card className="border-none shadow-2xl shadow-gray-100/50 bg-white/70 backdrop-blur-xl">
                    <CardBody className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-6 h-6 text-gray-300" />
                        </div>
                        <h2 className="text-base font-black text-gray-900 mb-1.5">No appointments found</h2>
                        <p className="text-gray-400 font-medium max-w-[240px] mb-5 text-[11px]">You haven't booked any consultations yet. Start by finding a specialist.</p>
                        <Button
                            onClick={() => navigate('/consultants')}
                            className="px-5 py-2.5 rounded-lg font-black uppercase tracking-widest shadow-xl shadow-primary-200 text-[10px]"
                        >
                            Find a Specialist
                        </Button>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {displayAppointments.map((apt) => {
                        return (
                            <Card key={apt.id} className="group border-none shadow-xl shadow-gray-100/40 hover:shadow-2xl hover:shadow-primary-100/30 transition-all duration-500 overflow-hidden bg-white/80 backdrop-blur-xl border border-white">
                                <CardBody className="p-0 flex flex-col lg:flex-row">
                                    {/* Doctor Info Section */}
                                    <div className="p-4 lg:w-48 bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center text-center relative border-b lg:border-b-0 lg:border-r border-gray-100/50">
                                        <div className="relative mb-3.5">
                                            <div className="w-14 h-14 rounded-xl bg-white shadow-xl overflow-hidden border-[3px] border-white group-hover:scale-105 transition-transform duration-500">
                                                <img
                                                    src={apt.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.display_name)}&background=random`}
                                                    alt={apt.display_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[2px] border-white flex items-center justify-center ${apt.status === 'confirmed' ? 'bg-success-500' : 'bg-warning-500'
                                                }`}>
                                                <ShieldCheck className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 mb-0.5 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{apt.display_name}</h3>
                                        <p className="text-[9px] font-black text-primary-600 uppercase tracking-[0.1em] mb-2.5">{apt.specialty}</p>

                                        <div className="flex items-center gap-1 px-2.5 py-0.5 bg-white rounded-full border border-gray-100 shadow-sm">
                                            <div className={`w-1 h-1 rounded-full animate-pulse ${apt.status === 'confirmed' ? 'bg-success-500' : 'bg-warning-500'
                                                }`}></div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">{apt.status}</span>
                                        </div>
                                    </div>

                                    {/* Appointment Details Section */}
                                    <div className="p-4 flex-1 flex flex-col justify-between bg-white/50">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-3 border-b border-gray-100/50 pb-4 mb-4">
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Date</span>
                                                        <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xs">
                                                            <Calendar className="w-3 h-3 text-primary-600" />
                                                            {new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col border-l border-gray-100 pl-4">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Time</span>
                                                        <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xs">
                                                            <Clock className="w-3 h-3 text-primary-600" />
                                                            {apt.appointment_time_slot}
                                                        </div>
                                                    </div>
                                                </div>
                                                {apt.notes && (
                                                    <div className="flex flex-col pt-0.5">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Reason</span>
                                                        <p className="text-[11px] font-bold text-gray-500 italic line-clamp-1">"{apt.notes}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Fee</span>
                                                <div className="flex flex-col items-end">
                                                    <p className="text-lg font-black text-gray-900 leading-none">
                                                        <span className="text-[10px] font-bold align-top mr-0.5">Rs.</span>
                                                        {apt.consultation_fee}
                                                    </p>
                                                    <div className={`mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${apt.payment_status === 'completed'
                                                            ? 'bg-success-50 text-success-700 border-success-100'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                        }`}>
                                                        <ShieldCheck className="w-2.5 h-2.5" />
                                                        <span className="text-[7.5px] font-black uppercase tracking-wider">
                                                            {apt.payment_status || 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2.5">
                                            <Button
                                                variant="secondary"
                                                className="flex-1 py-2 rounded-lg group/btn flex items-center justify-center gap-2 border-2 hover:bg-gray-50 text-gray-900 font-black uppercase tracking-widest text-[9px]"
                                                onClick={() => handleMessage(apt)}
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-primary-600 transition-colors" />
                                                Message
                                            </Button>

                                            <div className="flex-[1.2] py-2 rounded-lg flex items-center justify-center gap-2 bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[9px] border border-gray-100">
                                                <Clock className="w-3.5 h-3.5" />
                                                Wait for Doctor Call
                                            </div>
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
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                />
            )}
        </div>
    );
};

export default UserAppointments;
