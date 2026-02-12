import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardBody } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { Stethoscope, ShieldCheck, Save } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const SPECIALTIES = [
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

const LANGUAGES = [
    "English",
    "Nepali",
    "English, Nepali",
];

const DoctorProfessionalPrompt = () => {
    const { user, updateProfile } = useAuthStore();
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        displayName: user?.doctorProfile?.displayName || user?.name || "",
        specialty: user?.doctorProfile?.specialty || "",
        experience: user?.doctorProfile?.experience || "",
        rate: user?.doctorProfile?.rate || "",
        bio: user?.doctorProfile?.bio || "",
        qualifications: user?.doctorProfile?.qualifications || "",
        profile_languages: user?.doctorProfile?.languages || "",
    });

    useEffect(() => {
        // Show prompt if doctor and professional profile is NOT complete
        if (user?.role === "doctor" && user?.doctorProfileComplete === false) {
            setShow(true);
            document.body.style.overflow = "hidden"; // Lock scroll
        } else {
            setShow(false);
            document.body.style.overflow = "unset"; // Unlock scroll
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.displayName || !formData.specialty || !formData.experience) {
            toast.error("Please fill in basic professional details (Display Name, Specialty, Experience).");
            return;
        }

        setIsLoading(true);
        try {
            // Map frontend fields to backend expected names
            const result = await updateProfile({
                ...user,
                ...formData,
            });

            if (result.success) {
                toast.success("Professional profile updated successfully!");
                // No need to setShow(false) manually if it reactively hides based on user.doctorProfileComplete
            } else {
                toast.error(result.message || "Failed to update profile.");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
            <Card className="w-full max-w-2xl border-none shadow-3xl overflow-hidden bg-white/95 ring-1 ring-black/5 animate-in zoom-in-95 duration-300 my-auto">
                <CardBody className="p-8 sm:p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex gap-4">
                            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 shrink-0 shadow-inner">
                                <Stethoscope className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    Complete Professional Profile
                                </h2>
                                <p className="text-gray-500 font-medium">
                                    Admin has assigned you as a <span className="text-primary-600 font-bold">Doctor</span>. Please provide your practice details to proceed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Input
                                label="Display Name (e.g. Dr. Jane Smith)"
                                placeholder="Dr. Name"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="col-span-1"
                                required
                            />
                            <Select
                                label="Specialty"
                                options={SPECIALTIES}
                                value={formData.specialty}
                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                className="col-span-1"
                                required
                            />
                            <Input
                                label="Experience (Years)"
                                type="number"
                                placeholder="0"
                                value={formData.experience}
                                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                required
                            />
                            <Input
                                label="Consultation Fee (Rs.)"
                                type="number"
                                placeholder="0"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Input
                                label="Qualifications"
                                placeholder="e.g. MBBS, MD"
                                value={formData.qualifications}
                                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                            />
                            <Select
                                label="Languages"
                                options={LANGUAGES}
                                value={formData.profile_languages}
                                onChange={(e) => setFormData({ ...formData, profile_languages: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-black text-gray-700 block">Professional Bio & Approach</label>
                            <textarea
                                placeholder="Write a brief professional summary..."
                                className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 transition-all min-h-[120px] resize-none text-sm shadow-sm"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                loading={isLoading}
                                className="w-full font-bold h-12 shadow-xl shadow-primary-200"
                            >
                                <Save className="w-5 h-5 mr-2" /> Complete Profile & Proceed
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                        <ShieldCheck className="w-4 h-4" />
                        Verified Profile securely stored in doctor_profiles
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default DoctorProfessionalPrompt;
