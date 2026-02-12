import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import {
  ChevronRight,
  ChevronLeft,
  Heart,
  User,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ProfileSetup = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { updateProfile, user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    conditions: [],
    customConditions: "",
    parentalHistory: [],
    customParentalHistory: "",
    language: i18n.language || "en",
    // Keep doctor fields in formData to ensure persistence if they were somehow set
    displayName: "",
    specialty: "",
    experience: "",
    rate: "",
    bio: "",
    qualifications: "",
    profile_languages: ""
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        age: user.age || prev.age,
        gender: user.gender || prev.gender,
        conditions: Array.isArray(user.conditions) ? user.conditions : prev.conditions,
        customConditions: user.customConditions || prev.customConditions,
        parentalHistory: Array.isArray(user.parentalHistory) ? user.parentalHistory : prev.parentalHistory,
        customParentalHistory: user.customParentalHistory || prev.customParentalHistory,
        language: user.language || i18n.language,
        ...(user.doctorProfile ? {
          displayName: user.doctorProfile.displayName || user.name || "",
          specialty: user.doctorProfile.specialty || "",
          experience: user.doctorProfile.experience || "",
          rate: user.doctorProfile.rate || "",
          bio: user.doctorProfile.bio || "",
          qualifications: user.doctorProfile.qualifications || "",
          profile_languages: user.doctorProfile.languages || ""
        } : {})
      }));
    }
  }, [user, i18n.language]);

  const conditions = [
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

  const handleFinish = async () => {
    setIsLoading(true);
    const result = await updateProfile(formData);
    setIsLoading(false);

    if (result.success) {
      if (formData.language) {
        i18n.changeLanguage(formData.language);
      }
      toast.success(t("profile.setup.success") || "Profile setup complete!");

      if (user?.role === "admin") navigate("/admin");
      else if (user?.role === "doctor") navigate("/doctor-dashboard");
      else navigate("/dashboard");
    } else {
      toast.error(result.message || "Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                step >= i ? "w-8 bg-primary-600" : "w-4 bg-gray-200",
              )}
            />
          ))}
        </div>

        <Card className="border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardBody className="p-10">
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 mx-auto mb-6">
                    <User className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">
                    {t("profile.setup.step1.title")}
                  </h1>
                  <p className="text-gray-500 font-medium">
                    {t("profile.setup.step1.subtitle")}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label={t("profile.setup.step1.nameLabel")}
                    placeholder={t("profile.setup.step1.namePlaceholder")}
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <Input
                    label={t("profile.setup.step1.ageLabel")}
                    type="number"
                    placeholder={t("profile.setup.step1.agePlaceholder")}
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                  />
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block">
                      {t("profile.setup.step1.genderLabel")}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          key: "Male",
                          label: t("profile.setup.step1.genderMale"),
                        },
                        {
                          key: "Female",
                          label: t("profile.setup.step1.genderFemale"),
                        },
                        {
                          key: "Other",
                          label: t("profile.setup.step1.genderOther"),
                        },
                      ].map((g) => (
                        <button
                          key={g.key}
                          onClick={() =>
                            setFormData({ ...formData, gender: g.key })
                          }
                          className={cn(
                            "py-3 rounded-xl border-2 font-bold transition-all",
                            formData.gender === g.key
                              ? "bg-primary-50 border-primary-600 text-primary-700"
                              : "border-gray-100 hover:border-gray-200 text-gray-400",
                          )}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block">
                      {t("profile.setup.step1.languageLabel")}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "ne", label: t("profile.setup.step1.langNe") },
                        { key: "en", label: t("profile.setup.step1.langEn") },
                      ].map((l) => (
                        <button
                          key={l.key}
                          onClick={() => {
                            setFormData({ ...formData, language: l.key });
                            i18n.changeLanguage(l.key);
                          }}
                          className={cn(
                            "py-2 rounded-xl border-2 font-bold text-xs transition-all",
                            formData.language === l.key
                              ? "bg-primary-50 border-primary-600 text-primary-700"
                              : "border-gray-100 hover:border-gray-200 text-gray-400",
                          )}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-success-100 rounded-2xl flex items-center justify-center text-success-600 mx-auto mb-6">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">
                    {t("profile.setup.step2.title")}
                  </h1>
                  <p className="text-gray-500 font-medium">
                    {t("profile.setup.step2.subtitle")}
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block">
                      {t("profile.setup.step2.conditionsLabel")}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {conditions.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => handleToggle("conditions", c.key)}
                          className={cn(
                            "px-4 py-2 rounded-full border-2 text-sm font-bold transition-all",
                            formData.conditions.includes(c.key)
                              ? "bg-success-50 border-success-600 text-success-700"
                              : "border-gray-100 text-gray-400",
                          )}>
                          {c.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 block">
                        {t("profile.setup.step2.customLabel")}
                      </label>
                      <textarea
                        placeholder={t("profile.setup.step2.customPlaceholder")}
                        className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 transition-all min-h-[120px] resize-none text-sm"
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
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-warning-100 rounded-2xl flex items-center justify-center text-warning-600 mx-auto mb-6">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">
                    {t("profile.setup.step3.title")}
                  </h1>
                  <p className="text-gray-500 font-medium">
                    {t("profile.setup.step3.subtitle")}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">
                    {t("profile.setup.step3.parentsLabel")}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {conditions.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => handleToggle("parentalHistory", c.key)}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 text-sm font-bold transition-all",
                          formData.parentalHistory.includes(c.key)
                            ? "bg-warning-50 border-warning-600 text-warning-700"
                            : "border-gray-100 text-gray-400",
                        )}>
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 block">
                      {t("profile.setup.step3.customLabel")}
                    </label>
                    <textarea
                      placeholder={t("profile.setup.step3.customPlaceholder")}
                      className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 transition-all min-h-[120px] resize-none text-sm"
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
            )}

            <div className="flex gap-4 mt-12">
              {step > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1">
                  <ChevronLeft className="mr-2 w-5 h-5" /> {t("common.back")}
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  className="flex-1"
                  disabled={
                    step === 1 &&
                    (!formData.age || !formData.gender || !formData.name)
                  }>
                  {t("common.next")} <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="flex-1" loading={isLoading}>
                  {t("profile.setup.finish")}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
