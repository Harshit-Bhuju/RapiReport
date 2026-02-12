import React, { useState, useEffect } from "react";
import {
    Calendar,
    Clock,
    Video,
    MoreVertical,
    ChevronRight,
    User,
    AlertCircle,
    CheckCircle2,
    XCircle,
    FileText
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import { useNavigate } from "react-router-dom";
import API from "@/Configs/ApiEndpoints";

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await axios.get(API.USER_APPOINTMENTS, { withCredentials: true });
            if (res.data.status === "success") {
                setAppointments(res.data.appointments);
            }
        } catch (error) {
            toast.error("Failed to fetch appointments");
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'error';
            case 'completed': return 'secondary';
            default: return 'secondary';
        }
    };

    const handleJoinCall = (room_id) => {
        navigate(`/consultation/live/${room_id}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
                        <Calendar className="w-7 h-7" />
                    </div>
                    My Appointments
                </h1>
                <p className="text-gray-500 font-bold mt-1 text-sm">Track and manage your scheduled consultations</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-50 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : appointments.length === 0 ? (
                <Card className="border-none shadow-xl shadow-gray-100/50 py-20 text-center bg-white">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">No Appointments Yet</h3>
                    <p className="text-gray-500 font-medium mt-2 max-w-sm mx-auto">
                        You haven't scheduled any consultations. Browse our specialists to book your first appointment.
                    </p>
                    <Button
                        onClick={() => navigate("/consultants")}
                        className="mt-8 rounded-2xl px-8"
                    >
                        Browse Specialists
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {appointments.map((appt) => (
                        <Card key={appt.id} className="group border-none shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white">
                            <CardBody className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    {/* Left: Doctor Info */}
                                    <div className="p-6 md:w-1/3 flex items-center gap-4 border-b md:border-b-0 md:border-r border-gray-50">
                                        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center overflow-hidden border-2 border-primary-100">
                                            {appt.doctor_pic ? (
                                                <img src={appt.doctor_pic} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8 text-primary-200" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                                                {appt.doctor_name}
                                            </h3>
                                            <p className="text-xs font-bold text-gray-400 mt-0.5">{appt.doctor_specialty}</p>
                                        </div>
                                    </div>

                                    {/* Center: Appointment Details */}
                                    <div className="p-6 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-8">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-black text-gray-700">
                                                        {new Date(appt.appointment_date).toLocaleDateString("en-GB", {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-black text-gray-700">{appt.appointment_time_slot}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant={getStatusStyle(appt.status)} className="px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px] font-black">
                                                    {appt.status}
                                                </Badge>
                                                {appt.status === 'confirmed' && (
                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-success-600 uppercase tracking-widest animate-pulse">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Ready for Join
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {appt.status === 'confirmed' && appt.room_id && (
                                                <Button
                                                    onClick={() => handleJoinCall(appt.room_id)}
                                                    className="rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200 gap-2 font-black uppercase tracking-widest text-xs py-4 px-6 group/btn"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    Join Video Call
                                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                            )}
                                            {appt.status === 'pending' && (
                                                <p className="text-[10px] font-bold text-gray-400 max-w-[150px] leading-tight text-right italic">
                                                    Waiting for payment confirmation or doctor approval
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAppointments;
