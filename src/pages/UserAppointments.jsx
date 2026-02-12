import React, { useState, useEffect } from "react";
import API from "@/Configs/ApiEndpoints";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Calendar, Clock, Video, MessageSquare, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DirectChat from "@/components/features/DirectChat";

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
                setAppointments(Array.isArray(res.data.data) ? res.data.data : []);
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

    const handleJoinCall = (appointment) => {
        if (appointment.status !== 'confirmed') {
            toast.error("Call is only available for confirmed appointments.");
            return;
        }
        // Logic to join call - similar to family planner
        // Navigate to a call room or open modal
        // For now, redirect to a call page
        navigate(`/consultation-room/${appointment.id}`);
    };

    const handleMessage = (appointment) => {
        setSelectedChatUser({
            id: appointment.doctor_user_id,
            name: appointment.doctor_name,
            avatar: appointment.doctor_profile_pic
        });
        setIsChatOpen(true);
    };

    if (loading) return <div className="p-8 text-center">Loading appointments...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black text-gray-900">My Appointments</h1>

            {appointments.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200 shadow-none">
                    <CardBody className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                        <Calendar className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-bold">No appointments found.</p>
                        <Button className="mt-4" onClick={() => navigate('/consultants')}>Book a Consultation</Button>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {appointments.map((apt) => (
                        <Card key={apt.id} className="border-none shadow-lg shadow-gray-100/50 overflow-hidden">
                            <CardBody className="p-0 flex flex-col md:flex-row">
                                <div className="p-6 bg-primary-50 md:w-1/4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-primary-100">
                                    <div className="w-16 h-16 rounded-full bg-white mb-3 overflow-hidden border-2 border-primary-200">
                                        <img src={apt.doctor_profile_pic || "https://ui-avatars.com/api/?name=Dr+" + apt.doctor_name} alt={apt.doctor_name} className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="font-black text-primary-900">{apt.doctor_name}</h3>
                                    <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">{apt.specialty}</p>
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
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400">FEE</p>
                                            <p className="text-lg font-black text-gray-900">Rs. {apt.consultation_fee}</p>
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
                                        <Button
                                            className={`flex-1 gap-2 ${apt.status !== 'confirmed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={apt.status !== 'confirmed'}
                                            onClick={() => handleJoinCall(apt)}
                                        >
                                            <Video className="w-4 h-4" /> Join Call
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
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
