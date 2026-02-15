import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API from "@/Configs/ApiEndpoints";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
    Stethoscope,
    Users,
    Clock,
    Medal,
    MapPin,

    GraduationCap,
    ArrowLeft,
    CalendarCheck,
    MessageSquare,
    Globe,
    Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import Loading from "@/components/ui/Loading";

const ConsultantProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDoctorProfile();
    }, [id]);

    const fetchDoctorProfile = async () => {
        try {
            console.log("Fetching profile for ID:", id, "URL:", `${API.GET_CONSULTANT_PROFILE}?id=${id}`);
            const res = await axios.get(`${API.GET_CONSULTANT_PROFILE}?id=${id}`, {
                withCredentials: true,
                headers: { 'Accept': 'application/json' }
            });
            if (res.data.status === "success") {
                setDoctor(res.data.doctor);
            } else {
                console.warn("Profile fetch returned error status:", res.data);
                toast.error(res.data.message || "Doctor not found");
                navigate("/consultants");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            const msg = error.response?.data?.message || error.message || "Failed to load profile";
            toast.error(`Failed: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = () => {
        navigate("/booking", { state: { doctor } });
    };

    if (loading) return <Loading fullScreen />;
    if (!doctor) return null;

    const availability = Array.isArray(doctor.availability_json) ? doctor.availability_json : [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Back */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Doctor Profile</h1>
                    <p className="text-sm text-gray-500 font-medium">View details and book consultation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Profile Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl shadow-gray-100/50 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800"></div>
                        <CardBody className="p-8 relative">
                            <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-16 mb-6">
                                <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-white">
                                    {doctor.profile_pic ? (
                                        <img src={doctor.profile_pic} alt={doctor.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                            <Users className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 pb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-2xl font-black text-gray-900">{doctor.display_name || doctor.username}</h2>
                                        <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                                            <Medal className="w-3 h-3" />
                                            Verified
                                        </div>
                                    </div>
                                    <p className="text-primary-600 font-bold text-lg">{doctor.specialty}</p>
                                    <p className="text-gray-400 font-medium text-sm flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" /> {doctor.experience_years} years experience
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Consultation Fee</p>
                                        <p className="text-2xl font-black text-gray-900">Rs. {doctor.consultation_rate}</p>
                                    </div>
                                    <Button onClick={handleBookNow} className="px-8 shadow-lg shadow-primary-200">
                                        Book Appointment
                                    </Button>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none text-gray-600 font-medium leading-relaxed mb-10">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary-600" /> About the Doctor
                                </h3>
                                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 italic">
                                    "{doctor.bio || "No biography provided."}"
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-primary-600" /> Qualifications
                                    </h3>
                                    <p className="text-sm font-bold text-gray-700">{doctor.qualifications || "Not specified"}</p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-primary-600" /> Languages
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(doctor.profile_languages || "English, Nepali").split(',').map((lang, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-black uppercase tracking-wider">
                                                {lang.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {doctor.clinic_address && (
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary-600" /> Primary Clinic Address
                                        </h3>
                                        <p className="text-sm font-bold text-gray-700">{doctor.clinic_address}</p>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar Info - Availability */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-xl shadow-gray-100/50">
                        <CardBody className="p-6">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CalendarCheck className="w-4 h-4 text-primary-600" /> Availability
                            </h3>
                            <div className="space-y-3">
                                {availability.length > 0 ? (
                                    availability.map((slot, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700">
                                            <span>{slot.day}</span>
                                            <span className="text-primary-600 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">{slot.startTime} - {slot.endTime}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 italic font-medium">
                                        No schedule available.
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                </div>
            </div>
        </div>
    );
};


export default ConsultantProfile;
