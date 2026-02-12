import React from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import {
  HealthInsightCard,
  Typewriter,
} from "@/components/ui/HealthInsightCard";

const RiskAnalysis = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-warning-600" />
          {t("risk.title")}
        </h1>
        <p className="text-gray-500 font-bold mt-2">{t("risk.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analysis Area */}
        <div className="lg:col-span-2 space-y-6">
          {user?.parentalHistory?.length > 0
            ? user.parentalHistory.map((condition) => (
                <Card
                  key={condition}
                  className="border-none shadow-xl shadow-gray-100 overflow-hidden">
                  <CardBody className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-warning-50 rounded-2xl flex items-center justify-center text-warning-600">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900">
                            {condition} {t("risk.predisposition")}
                          </h3>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {t("risk.hereditaryHigh")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-3xl p-6 mb-6">
                      <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                        <Typewriter
                          text={
                            condition === "Diabetes"
                              ? t("risk.diabetesAdvice")
                              : condition === "Heart Disease"
                                ? t("risk.heartAdvice")
                                : t("risk.generalAdvice")
                          }
                        />
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 border border-warning-100 rounded-2xl bg-warning-50/30">
                        <p className="text-[10px] font-black text-warning-600 uppercase tracking-[0.2em] mb-2 text-center">
                          {t("risk.dietarySolution")}
                        </p>
                        <p className="text-xs font-bold text-gray-600 text-center leading-relaxed">
                          {condition === "Diabetes"
                            ? t("risk.diabetesDiet")
                            : t("risk.generalDiet")}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            : null}

          {user?.customParentalHistory && (
            <Card className="border-none shadow-xl shadow-gray-100 overflow-hidden">
              <CardBody className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-warning-50 rounded-2xl flex items-center justify-center text-warning-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">
                      {t("profile.setup.step3.customLabel")}
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {t("risk.hereditaryHigh")}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6">
                  <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                    <Typewriter text={user.customParentalHistory} />
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {!user?.parentalHistory?.length && !user?.customParentalHistory && (
            <Card className="border-dashed border-2 p-12 text-center bg-transparent">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {t("risk.noRisksTitle")}
              </h3>
              <p className="text-gray-500 font-bold mb-8 max-w-sm mx-auto">
                {t("risk.noRisksDesc")}
              </p>
            </Card>
          )}
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-gray-900 text-white overflow-hidden">
            <CardBody className="p-8">
              <h3 className="text-lg font-black mb-4">
                {t("risk.protectFuture")}
              </h3>
              <p className="text-sm font-bold text-gray-400 leading-relaxed mb-6">
                {t("risk.protectDesc")}
              </p>
              <button className="w-full py-4 bg-primary-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary-500 transition-colors">
                {t("risk.bookCheckup")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </CardBody>
          </Card>

          <HealthInsightCard
            type="info"
            insights={[
              {
                en: t("risk.preventionAccuracyEn"),
                ne: t("risk.preventionAccuracyNe"),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysis;
