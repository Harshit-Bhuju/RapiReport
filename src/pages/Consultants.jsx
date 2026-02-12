import React, { useState, useEffect } from "react";
import {
    Users,
    Search,
    Stethoscope,
    Briefcase,
    Clock,
    Star,
    ChevronRight,
    Filter,
    ShieldCheck,
    Calendar
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import API from "@/Configs/ApiEndpoints";

import Select from "@/components/ui/Select";

const SPECIALTIES = [
    "All",
    "General Physician",
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Psychiatrist",
    "Orthopedist",
    "Gynecologist",
    "ENT Specialist",
    "Neurologist",
    "Oncologist",
    "Radiologist",
    "Urologist",
];

const Consultants = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [specialtyFilter, setSpecialtyFilter] = useState("All");
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await axios.get(API.CONSULTANTS_LIST, { withCredentials: true });
            if (res.data.status === "success") {
                setDoctors(res.data.doctors);
            }
        } catch (error) {
            toast.error("Failed to fetch doctors");
        } finally {
            setLoading(false);
        }
    };

    const filteredDoctors = doctors.filter(d => {
        const matchesSearch = d.username.toLowerCase().includes(search.toLowerCase()) ||
            d.specialty.toLowerCase().includes(search.toLowerCase());
        const matchesSpecialty = specialtyFilter === "All" || d.specialty === specialtyFilter;
        return matchesSearch && matchesSpecialty;
    });

    const handleBookNow = (doctor) => {
        navigate("/booking", { state: { doctor } });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 shadow-sm shadow-primary-100">
                            <Stethoscope className="w-7 h-7" />
                        </div>
                        Our Specialists
                    </h1>
                    <p className="text-gray-500 font-bold mt-1 text-sm">Consult with top-rated medical professionals online</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="space-y-6">
                    <Card className="border-none shadow-xl shadow-gray-100/50">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-2 mb-6 text-gray-900 font-black uppercase text-xs tracking-widest">
                                <Filter className="w-4 h-4 text-primary-600" />
                                Filters
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Doctor name..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Select
                                        label="Specialty"
                                        options={SPECIALTIES}
                                        value={specialtyFilter}
                                        onChange={(e) => setSpecialtyFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-none shadow-xl shadow-gray-100/50 bg-indigo-600 text-white overflow-hidden relative">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <CardBody className="p-6 relative z-10">
                            <ShieldCheck className="w-10 h-10 text-indigo-200 mb-4" />
                            <h3 className="text-lg font-black leading-tight mb-2">Verified Doctors</h3>
                            <p className="text-indigo-100 text-xs font-medium leading-relaxed">
                                All our specialists are thoroughly vetted and verified to ensure high-quality healthcare.
                            </p>
                        </CardBody>
                    </Card>
                </div>

                {/* Doctors Grid */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <Card key={i} className="border-none shadow-xl shadow-gray-100/50 border-gray-100 bg-white animate-pulse">
                                    <div className="h-64 bg-gray-50" />
                                </Card>
                            ))}
                        </div>
                    ) : filteredDoctors.length === 0 ? (
                        <Card className="border-none shadow-xl shadow-gray-100/50 py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900">No Specialists Found</h3>
                            <p className="text-gray-500 font-medium mt-2">Try adjusting your filters or search terms</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredDoctors.map((doc) => {
                                const availability = Array.isArray(doc.availability_json) ? doc.availability_json : (doc.availability_json ? JSON.parse(doc.availability_json) : []);

                                return (
                                    <Card key={doc.id} className="group border-none shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-primary-100/50 transition-all duration-300 overflow-hidden bg-white">
                                        <CardBody className="p-6">
                                            <div className="flex flex-col items-center text-center mb-6">
                                                <div className="relative mb-4">
                                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-50 shadow-inner">
                                                        {doc.profile_pic ? (
                                                            <img src={doc.profile_pic} alt={doc.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                                                                <Users className="w-10 h-10" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Rating removed as requested */}

                                                <h3 className="text-lg font-black text-gray-900 group-hover:text-primary-600 transition-colors">
                                                    {doc.display_name || doc.username}
                                                </h3>
                                                <div className="px-3 py-1 mt-2 rounded-full bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-wider">
                                                    {doc.specialty}
                                                </div>
                                            </div>

                                            {/* Availability Section */}
                                            <div className="mb-6 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    Available Schedule
                                                </div>
                                                <div className="space-y-1">
                                                    {availability.length > 0 ? (
                                                        availability.map((slot, idx) => (
                                                            <div key={idx} className="flex justify-between text-xs font-bold text-gray-700">
                                                                <span>{slot.day}</span>
                                                                <span className="text-primary-600">{slot.startTime} - {slot.endTime}</span>
                                                            </div>
                                                        )).slice(0, 3) // Show first 3 slots only to save space
                                                    ) : (
                                                        <p className="text-xs font-medium text-gray-400 italic">No schedule set</p>
                                                    )}
                                                    {availability.length > 3 && (
                                                        <p className="text-[10px] text-gray-400 text-center pt-1">+{availability.length - 3} more days</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mb-6 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Exp</p>
                                                    <p className="text-xs font-black text-gray-900">{doc.experience_years}y</p>
                                                </div>
                                                <div className="w-px h-8 bg-gray-200" />
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Fee</p>
                                                    <p className="text-xs font-black text-primary-600">Rs. {doc.consultation_rate}</p>
                                                </div>
                                            </div>

                                            <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-6 text-center leading-relaxed">
                                                {doc.bio || "No description available for this consultant."}
                                            </p>

                                            <div className="flex gap-3">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => navigate(`/consultant-profile/${doc.id}`)}
                                                    className="flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-50"
                                                >
                                                    Profile
                                                </Button>
                                                <Button
                                                    onClick={() => handleBookNow(doc)}
                                                    className="flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest bg-primary-600 text-white shadow-lg shadow-primary-100 hover:bg-primary-700 gap-2 group/btn"
                                                >
                                                    Book
                                                    <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default Consultants;
