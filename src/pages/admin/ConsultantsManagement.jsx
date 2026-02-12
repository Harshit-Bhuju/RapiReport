import React, { useState, useEffect } from "react";
import {
    Users,
    Plus,
    Search,
    Filter,
    Stethoscope,
    Mail,
    Briefcase,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    X
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";

const ConsultantsManagement = () => {
    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        specialty: "General Physician",
        experience_years: 0,
        consultation_rate: 0,
        bio: "",
        profile_pic: ""
    });

    useEffect(() => {
        fetchConsultants();
    }, []);

    const fetchConsultants = async () => {
        try {
            const res = await axios.get("/backend/api/admin/get_consultants.php", { withCredentials: true });
            if (res.data.status === "success") {
                setConsultants(res.data.consultants);
            }
        } catch (error) {
            toast.error("Failed to fetch consultants");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/backend/api/admin/create_consultant.php", formData, { withCredentials: true });
            if (res.data.status === "success") {
                toast.success("Consultant added successfully");
                setIsAddModalOpen(false);
                setFormData({
                    email: "",
                    username: "",
                    specialty: "General Physician",
                    experience_years: 0,
                    consultation_rate: 0,
                    bio: "",
                    profile_pic: ""
                });
                fetchConsultants();
            } else {
                toast.error(res.data.message || "Failed to add consultant");
            }
        } catch (error) {
            toast.error("Error adding consultant");
        }
    };

    const filteredConsultants = consultants.filter(c =>
        c.username.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.specialty.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                        Consultants Management
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Add and manage medical professionals</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-200 gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Consultant
                </Button>
            </div>

            <Card className="border-none shadow-xl shadow-gray-100/50">
                <CardBody className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or specialty..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Consultant</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Specialty</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Experience</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Rate</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center">
                                            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-gray-500 font-medium">Loading consultants...</p>
                                        </td>
                                    </tr>
                                ) : filteredConsultants.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-bold">No consultants found</p>
                                            <p className="text-gray-500 text-sm mt-1">Try adjusting your search criteria</p>
                                        </td>
                                    </tr>
                                ) : filteredConsultants.map((consultant) => (
                                    <tr key={consultant.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center overflow-hidden border border-primary-100">
                                                    {consultant.profile_pic ? (
                                                        <img src={consultant.profile_pic} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-primary-600">{consultant.username.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{consultant.username}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                                        <Mail className="w-3 h-3 text-gray-400" />
                                                        {consultant.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100 flex items-center gap-1.5 shadow-sm">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {consultant.specialty}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                <Briefcase className="w-4 h-4 text-gray-400" />
                                                {consultant.experience_years} Years
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1 text-sm font-black text-gray-900">
                                                <span className="text-primary-600 font-bold">Rs.</span>
                                                {consultant.consultation_rate}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${consultant.is_available
                                                ? "bg-success-50 text-success-700 border-success-200"
                                                : "bg-gray-100 text-gray-500 border-gray-200"
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${consultant.is_available ? "bg-success-500" : "bg-gray-400"}`} />
                                                {consultant.is_available ? "Available" : "Away"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Button variant="ghost" className="text-gray-400 hover:text-primary-600 hover:bg-primary-50 p-2">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* Add Consultant Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-primary-600 text-white">
                            <div>
                                <h2 className="text-2xl font-black">Add New Consultant</h2>
                                <p className="text-primary-100 text-sm mt-1">Create a professional profile for a doctor</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all font-medium"
                                        placeholder="Dr. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all font-medium"
                                        placeholder="doctor@rapireport.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Specialty</label>
                                    <select
                                        name="specialty"
                                        value={formData.specialty}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all font-medium cursor-pointer"
                                    >
                                        <option>General Physician</option>
                                        <option>Cardiologist</option>
                                        <option>Dermatologist</option>
                                        <option>Pediatrician</option>
                                        <option>Psychiatrist</option>
                                        <option>Orthopedist</option>
                                        <option>Gynecologist</option>
                                        <option>ENT Specialist</option>
                                        <option>Neurologist</option>
                                        <option>Oncologist</option>
                                        <option>Radiologist</option>
                                        <option>Urologist</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Experience</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="experience_years"
                                                value={formData.experience_years}
                                                onChange={handleInputChange}
                                                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all font-medium"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Yrs</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rate</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="consultation_rate"
                                                value={formData.consultation_rate}
                                                onChange={handleInputChange}
                                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all font-medium"
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <DollarSign className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bio / Description</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all font-medium resize-none"
                                        placeholder="Tell us about the doctor's background..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Profile Picture URL (Optional)</label>
                                    <input
                                        type="text"
                                        name="profile_pic"
                                        value={formData.profile_pic}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all font-medium"
                                        placeholder="https://example.com/photo.jpg"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border-2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary-600 text-white shadow-xl shadow-primary-200"
                                >
                                    Create Consultant
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantsManagement;
