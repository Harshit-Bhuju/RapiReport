import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateProfile } = useAuthStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    conditions: [],
    parentalHistory: [],
    language: "Both",
  });

  const conditions = [
    "Diabetes",
    "BP",
    "Heart Disease",
    "Thyroid",
    "Cholesterol",
  ];

  const handleToggle = (listName, item) => {
    setFormData((prev) => ({
      ...prev,
      [listName]: prev[listName].includes(item)
        ? prev[listName].filter((i) => i !== item)
        : [...prev[listName], item],
    }));
  };

  const handleFinish = () => {
    updateProfile(formData);
    navigate("/dashboard");
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
                    Basic Information
                  </h1>
                  <p className="text-gray-500 font-medium">
                    Let's start with the basics to personalize your health AI.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label="What is your full name?"
                    placeholder="Enter your name"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <Input
                    label="How old are you?"
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                  />
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block">
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Male", "Female", "Other"].map((g) => (
                        <button
                          key={g}
                          onClick={() =>
                            setFormData({ ...formData, gender: g })
                          }
                          className={cn(
                            "py-3 rounded-xl border-2 font-bold transition-all",
                            formData.gender === g
                              ? "bg-primary-50 border-primary-600 text-primary-700"
                              : "border-gray-100 hover:border-gray-200 text-gray-400",
                          )}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block">
                      Preferred Language
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Nepali", "English", "Both"].map((l) => (
                        <button
                          key={l}
                          onClick={() =>
                            setFormData({ ...formData, language: l })
                          }
                          className={cn(
                            "py-2 rounded-xl border-2 font-bold text-xs transition-all",
                            formData.language === l
                              ? "bg-primary-50 border-primary-600 text-primary-700"
                              : "border-gray-100 hover:border-gray-200 text-gray-400",
                          )}>
                          {l}
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
                    Health Background
                  </h1>
                  <p className="text-gray-500 font-medium">
                    This helps us flag critical results specially for you.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block">
                      Do you have any existing conditions?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {conditions.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleToggle("conditions", c)}
                          className={cn(
                            "px-4 py-2 rounded-full border-2 text-sm font-bold transition-all",
                            formData.conditions.includes(c)
                              ? "bg-success-50 border-success-600 text-success-700"
                              : "border-gray-100 text-gray-400",
                          )}>
                          {c}
                        </button>
                      ))}
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
                    Family History
                  </h1>
                  <p className="text-gray-500 font-medium">
                    Risk assessment based on parental complications.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">
                    Parents' medical complications?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleToggle("parentalHistory", c)}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 text-sm font-bold transition-all",
                          formData.parentalHistory.includes(c)
                            ? "bg-warning-50 border-warning-600 text-warning-700"
                            : "border-gray-100 text-gray-400",
                        )}>
                        {c}
                      </button>
                    ))}
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
                  <ChevronLeft className="mr-2 w-5 h-5" /> Back
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
                  Next <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="flex-1">
                  Complete Setup
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
