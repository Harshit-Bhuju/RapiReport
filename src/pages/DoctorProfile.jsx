import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  Briefcase,
  FileText,
  Save,
  ArrowLeft,
  Star,
  Clock,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const SPECIALTIES = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Psychiatrist",
  "Orthopedist",
  "Gynecologist",
  "ENT",
  "Other",
];

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    displayName: user?.name ? `Dr. ${user.name}` : "",
    specialty: "General Physician",
    experienceYears: "5",
    consultationRate: "500",
    bio: "Share a short bio about your practice and approach to patient care.",
    languages: "English, Nepali",
    qualifications: "MBBS, MD",
  });

  const handleSave = async () => {
    if (!formData.displayName || !formData.specialty) {
      toast.error("Please fill in display name and specialty.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Doctor profile saved successfully!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <Stethoscope className="w-6 h-6" />
            </div>
            Doctor Profile
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage your professional profile for patients
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="hidden sm:flex gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview card */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card className="border-none shadow-xl shadow-gray-100/50 sticky top-24">
            <CardBody className="p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                How patients see you
              </p>
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-black mb-4 overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={formData.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    formData.displayName?.charAt(0) || "D"
                  )}
                </div>
                <h3 className="text-lg font-black text-gray-900">
                  {formData.displayName || "Dr. Name"}
                </h3>
                <p className="text-sm font-semibold text-primary-600 mb-2">
                  {formData.specialty}
                </p>
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formData.experienceYears} yrs exp
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-warning-500 fill-current" />
                    4.9
                  </span>
                </div>
                <div className="w-full pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Consult fee
                  </p>
                  <p className="text-xl font-black text-gray-900">
                    Rs. {formData.consultationRate || "—"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Professional details
                </h2>
              </div>

              <div className="space-y-5">
                <Input
                  label="Display name (e.g. Dr. Name)"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Dr. Jane Smith"
                />
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Specialty
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, specialty: s })
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all",
                          formData.specialty === s
                            ? "bg-primary-50 border-primary-600 text-primary-700"
                            : "border-gray-100 hover:border-gray-200 text-gray-500",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Experience (years)"
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceYears: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Consultation fee (Rs.)"
                    type="number"
                    min="0"
                    value={formData.consultationRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consultationRate: e.target.value,
                      })
                    }
                  />
                </div>
                <Input
                  label="Qualifications (e.g. MBBS, MD)"
                  value={formData.qualifications}
                  onChange={(e) =>
                    setFormData({ ...formData, qualifications: e.target.value })
                  }
                  placeholder="MBBS, MD"
                />
                <Input
                  label="Languages"
                  value={formData.languages}
                  onChange={(e) =>
                    setFormData({ ...formData, languages: e.target.value })
                  }
                  placeholder="English, Nepali"
                />
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center text-success-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Bio</h2>
              </div>
              <textarea
                className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 transition-all min-h-[140px] resize-none text-sm"
                placeholder="Write a short bio about your practice and how you help patients..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
            </CardBody>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={handleSave}
              className="gap-2 min-w-[140px]"
            >
              <Save className="w-4 h-4" /> Save profile
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        UI only — profile is stored locally. Connect your API to persist doctor
        profile data.
      </p>
    </div>
  );
};

export default DoctorProfile;
