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

    const specialties = ["All", ...new Set(doctors.map(d => d.specialty))];

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
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Specialty</label>
                                    <div className="flex flex-wrap gap-2">
                                        {specialties.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setSpecialtyFilter(s)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${specialtyFilter === s
                                                    ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-100"
                                                    : "bg-white text-gray-600 border-gray-100 hover:border-primary-200 hover:bg-primary-50/30"
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
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
                            {filteredDoctors.map((doc) => (
                                <Card key={doc.id} className="group border-none shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-primary-100/50 transition-all duration-300 overflow-hidden bg-white">
                                    <div className="relative h-48 overflow-hidden bg-gray-50">
                                        {doc.profile_pic ? (
                                            <img src={doc.profile_pic} alt={doc.username} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary-50">
                                                <Users className="w-16 h-16 text-primary-200" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-sm border border-white flex items-center gap-1.5">
                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-black text-gray-900">4.9</span>
                                        </div>
                                        <div className="absolute bottom-4 left-4">
                                            <div className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary-200">
                                                {doc.specialty}
                                            </div>
                                        </div>
                                    </div>
                                    <CardBody className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors">{doc.username}</h3>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                        <Briefcase className="w-3.5 h-3.5" />
                                                        {doc.experience_years} Years
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Mon - Fri
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fee</p>
                                                <p className="text-lg font-black text-gray-900">
                                                    <span className="text-primary-600 text-sm mr-1">Rs.</span>
                                                    {doc.consultation_rate}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-6 leading-relaxed">
                                            {doc.bio || "No description available for this consultant."}
                                        </p>

                                        <div className="flex gap-3">
                                            <Button
                                                variant="secondary"
                                                className="flex-1 rounded-2xl py-3 text-xs font-black uppercase tracking-widest border-2 hover:bg-gray-50"
                                            >
                                                View Profile
                                            </Button>
                                            <Button
                                                onClick={() => handleBookNow(doc)}
                                                className="flex-1 rounded-2xl py-3 text-xs font-black uppercase tracking-widest bg-primary-600 text-white shadow-xl shadow-primary-100 hover:bg-primary-700 gap-2 group/btn"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                Book Now
                                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Consultants;
