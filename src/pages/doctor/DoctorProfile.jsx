import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
import API from "@/Configs/ApiEndpoints";

import Select from "@/components/ui/Select";

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

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    displayName: user?.doctorProfile?.displayName || user?.name || "",
    specialty: user?.doctorProfile?.specialty || "General Physician",
    experienceYears: user?.doctorProfile?.experience || "5",
    consultationRate: user?.doctorProfile?.rate || "500",
    bio: user?.doctorProfile?.bio || "Share a short bio about your practice and approach to patient care.",
    languages: user?.doctorProfile?.languages || "English, Nepali",
    qualifications: user?.doctorProfile?.qualifications || "MBBS, MD",
  });

  const handleSave = async () => {
    if (!formData.displayName || !formData.specialty) {
      toast.error("Please fill in display name and specialty.");
      return;
    }
    setSaving(true);
    try {
      // Map frontend fields to backend expected names
      const profileData = {
        ...user, // Include existing user fields (age, gender, etc.)
        name: user.name,
        displayName: formData.displayName,
        specialty: formData.specialty,
        experience: formData.experienceYears,
        rate: formData.consultationRate,
        bio: formData.bio,
        qualifications: formData.qualifications,
        profile_languages: formData.languages,
      };

      const availabilityPromise = axios.post(
        API.DOCTOR_AVAILABILITY,
        { availability: formData.availability },
        { withCredentials: true }
      );

      const [result, availResult] = await Promise.all([
        updateProfile(profileData),
        availabilityPromise
      ]);

      if (result.success && availResult.data.status === "success") {
        toast.success("Doctor profile and availability saved successfully!");
      } else {
        toast.error(result.message || availResult.data.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Save Profile Error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Specialty"
                    options={SPECIALTIES}
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                    required
                  />
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
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Input
                    label="Qualifications (e.g. MBBS, MD)"
                    value={formData.qualifications}
                    onChange={(e) =>
                      setFormData({ ...formData, qualifications: e.target.value })
                    }
                    placeholder="MBBS, MD"
                  />
                </div>
                <Select
                  label="Primary Practice Languages"
                  options={LANGUAGES}
                  value={formData.languages}
                  onChange={(e) =>
                    setFormData({ ...formData, languages: e.target.value })
                  }
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

          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Availability</h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">Set your weekly availability for consultations. Patients can only book slots within these times.</p>
                {/* Simple Availability UI - can be expanded */}
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                  <div key={day} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl">
                    <div className="w-24 font-bold text-sm">{day}</div>
                    <select
                      className="p-2 border rounded-lg text-sm bg-gray-50"
                      value={formData.availability?.find(s => s.day === day)?.startTime || "09:00"}
                      onChange={(e) => {
                        const newAv = [...(formData.availability || [])];
                        const idx = newAv.findIndex(s => s.day === day);
                        if (idx >= 0) newAv[idx].startTime = e.target.value;
                        else newAv.push({ day, startTime: e.target.value, endTime: "17:00" });
                        setFormData({ ...formData, availability: newAv });
                      }}
                    >
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">01:00 PM</option>
                    </select>
                    <span className="text-gray-400">-</span>
                    <select
                      className="p-2 border rounded-lg text-sm bg-gray-50"
                      value={formData.availability?.find(s => s.day === day)?.endTime || "17:00"}
                      onChange={(e) => {
                        const newAv = [...(formData.availability || [])];
                        const idx = newAv.findIndex(s => s.day === day);
                        if (idx >= 0) newAv[idx].endTime = e.target.value;
                        else newAv.push({ day, startTime: "09:00", endTime: e.target.value });
                        setFormData({ ...formData, availability: newAv });
                      }}
                    >
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">01:00 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="17:00">05:00 PM</option>
                      <option value="18:00">06:00 PM</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.availability?.find(s => s.day === day)}
                        onChange={(e) => {
                          let newAv = [...(formData.availability || [])];
                          if (e.target.checked) {
                            if (!newAv.find(s => s.day === day)) {
                              newAv.push({ day, startTime: "09:00", endTime: "17:00" });
                            }
                          } else {
                            newAv = newAv.filter(s => s.day !== day);
                          }
                          setFormData({ ...formData, availability: newAv });
                        }}
                      />
                      Active
                    </label>
                  </div>
                ))}
              </div>
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
        Your professional profile is visible to patients during booking and
        consultation.
      </p>
    </div>
  );
};

export default DoctorProfile;
