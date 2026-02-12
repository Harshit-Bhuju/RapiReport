import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Heart, User, ShieldCheck, Save, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();

  const parseArray = (data) => {
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const [formData, setFormData] = useState({
    name: user?.name || "",
    age: user?.age || "",
    gender: user?.gender || "",
    conditions: parseArray(user?.conditions),
    customConditions: user?.customConditions || "",
    parentalHistory: parseArray(user?.parentalHistory),
    customParentalHistory: user?.customParentalHistory || "",
    language: user?.language || "en",
  });

  const conditionsList = [
    { key: "diabetes", label: t("conditions.diabetes") },
    { key: "bp", label: t("conditions.bp") },
    { key: "heart", label: t("conditions.heart") },
    { key: "thyroid", label: t("conditions.thyroid") },
  ];

  const handleToggle = (listName, item) => {
    setFormData((prev) => ({
      ...prev,
      [listName]: prev[listName].includes(item)
        ? prev[listName].filter((i) => i !== item)
        : [...prev[listName], item],
    }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.age || !formData.gender) {
      toast.error(
        t("auth.setupRequiredFields") || "Please fill in all basic information",
      );
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success("Profile updated successfully!");
        // Navigation removed as requested
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred while saving your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Health Profile
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Update your medical background and preferences
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/my-appointments")}
            className="hidden sm:flex border-primary-200 text-primary-700 bg-primary-50">
            My Appointments
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="hidden sm:flex">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t("common.back")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Basic Details
                </h2>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <Input
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                />
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Male", "Female", "Other"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={cn(
                          "py-2 rounded-xl border-2 font-bold text-sm transition-all",
                          formData.gender === g
                            ? "bg-primary-50 border-primary-600 text-primary-700"
                            : "border-gray-50 hover:border-gray-100 text-gray-400",
                        )}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Preferred Language
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "ne", label: "Nepali" },
                      { key: "en", label: "English" },
                    ].map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, language: l.key });
                        }}
                        className={cn(
                          "py-2 rounded-xl border-2 font-bold text-sm transition-all",
                          formData.language === l.key
                            ? "bg-primary-50 border-primary-600 text-primary-700"
                            : "border-gray-50 hover:border-gray-100 text-gray-400",
                        )}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Health Background */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Personal Conditions */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center text-success-600">
                      <Heart className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Medical Conditions
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {conditionsList.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => handleToggle("conditions", c.key)}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 text-sm font-bold transition-all",
                          formData.conditions.includes(c.key)
                            ? "bg-success-50 border-success-600 text-success-700"
                            : "border-gray-50 text-gray-400",
                        )}>
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Additional Details
                    </label>
                    <textarea
                      className="w-full p-4 rounded-xl border-2 border-gray-50 focus:border-primary-500 focus:ring-0 transition-all min-h-[100px] resize-none text-sm"
                      placeholder="Type any other conditions..."
                      value={formData.customConditions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customConditions: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Family History */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning-100 rounded-xl flex items-center justify-center text-warning-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Family History
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {conditionsList.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => handleToggle("parentalHistory", c.key)}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 text-sm font-bold transition-all",
                          formData.parentalHistory.includes(c.key)
                            ? "bg-warning-50 border-warning-600 text-warning-700"
                            : "border-gray-50 text-gray-400",
                        )}>
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Other Family Issues
                    </label>
                    <textarea
                      className="w-full p-4 rounded-xl border-2 border-gray-50 focus:border-primary-500 focus:ring-0 transition-all min-h-[100px] resize-none text-sm"
                      placeholder="Type parental history details..."
                      value={formData.customParentalHistory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customParentalHistory: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-50 flex justify-end">
                <Button onClick={handleSave} className="w-full sm:w-auto px-8">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
