import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Users,
  ChevronRight,
  FileText,
  LineChart,
  Brain,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Activity,
  Lock,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="relative pt-28 pb-24 md:pt-36 md:pb-32 overflow-hidden bg-[#fafbfc]">
      {/* Subtle grid + single accent glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-[480px] h-[480px] bg-slate-300/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}>
              <p className="font-heading text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase mb-6">
                01 — Overview
              </p>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                {t("hero.badge")}
              </span>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-6 leading-[1.08] tracking-tight">
                {t("hero.title").split(" ").slice(0, 2).join(" ")}
                <br />
                <span className="text-primary-600">
                  {t("hero.title").split(" ").slice(2).join(" ")}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed font-medium">
                {t("hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button
                  size="lg"
                  className="font-heading px-8 py-3.5 text-base font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 hover:shadow-xl transition-all"
                  onClick={() => navigate("/auth")}>
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-500">
                  Trusted by <strong className="text-slate-700">10,000+</strong> users
                </span>
              </div>
            </motion.div>
          </div>

          {/* Hero Image/Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-6xl mx-auto px-4">
            <div className="relative rounded-xl overflow-hidden shadow-xl border border-slate-200/80 bg-white">
              {/* Browser Chrome */}
              <div className="bg-slate-50 px-4 py-3 flex items-center gap-2 border-b border-slate-200/80">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1.5 text-xs text-slate-500 hidden sm:block">
                  {t("hero.mockTitle")}
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-4 sm:p-6 md:p-8 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {[
                    {
                      icon: FileText,
                      label: "Reports",
                      value: "24",
                      color: "blue",
                    },
                    {
                      icon: TrendingUp,
                      label: "Insights",
                      value: "156",
                      color: "green",
                    },
                    {
                      icon: Clock,
                      label: "Last Upload",
                      value: "2h ago",
                      color: "purple",
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200/50 hover:shadow-md transition-shadow">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                          item.color === "blue" && "bg-blue-100 text-blue-600",
                          item.color === "green" &&
                          "bg-green-100 text-green-600",
                          item.color === "purple" &&
                          "bg-purple-100 text-purple-600",
                        )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                        {item.value}
                      </p>
                      <p className="text-sm text-slate-600">{item.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Animated Chart Area */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200/50 relative overflow-hidden group/chart">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Health Trend Analysis
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Real-time biometric tracking
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[8px] font-bold uppercase tracking-wider">
                        Weekly
                      </div>
                      <div className="px-2 py-1 rounded-md bg-slate-50 text-slate-400 text-[8px] font-bold uppercase tracking-wider">
                        Monthly
                      </div>
                    </div>
                  </div>

                  <div className="h-32 sm:h-48 relative">
                    <svg viewBox="0 0 400 150" className="w-full h-full">
                      {/* Grid Lines */}
                      {[0, 1, 2, 3].map((i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={i * 50}
                          x2="400"
                          y2={i * 50}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Animated Area Chart */}
                      <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        d="M0,120 Q50,80 100,100 T200,40 T300,70 T400,20 V150 H0 Z"
                        fill="url(#gradient-blue)"
                        className="opacity-20"
                      />
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        d="M0,120 Q50,80 100,100 T200,40 T300,70 T400,20"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Pulsing Dots */}
                      <motion.circle
                        animate={{ r: [3, 5, 3], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        cx="200"
                        cy="40"
                        r="4"
                        fill="#3b82f6"
                      />

                      <defs>
                        <linearGradient
                          id="gradient-blue"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop
                            offset="100%"
                            stopColor="#3b82f6"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Scan Line Animation */}
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent z-10 opacity-50"
                    />
                  </div>

                  {/* Floating Tooltip Mock */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white p-3 rounded-lg shadow-2xl scale-0 group-hover/chart:scale-100 transition-transform origin-bottom z-20">
                    <p className="text-[10px] font-bold text-blue-400 mb-1">
                      Peak Vitality
                    </p>
                    <p className="text-sm font-black italic">98.2%</p>
                  </div>
                </div>
                {/* Recent Reports List Mockup */}
                <div className="mt-8 pt-8 border-t border-slate-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900">
                      Recent Reports
                    </h4>
                    <button className="text-[10px] font-bold text-blue-600 hover:underline">
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        name: "Blood Panel X-24",
                        date: "Today, 14:20",
                        status: "Analyzed",
                        color: "blue",
                      },
                      {
                        name: "MRI Scan Analysis",
                        date: "Yesterday",
                        status: "Pending",
                        color: "orange",
                      },
                    ].map((report, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group/item">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              report.color === "blue"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-orange-50 text-orange-600",
                            )}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                              {report.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {report.date}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider",
                            report.status === "Analyzed"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600",
                          )}>
                          {report.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Visuals with higher depth */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-slate-200/80 hidden lg:block z-30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Live Vitals
                  </p>
                  <p className="font-black text-slate-900 text-lg tabular-nums">
                    72{" "}
                    <span className="text-xs font-medium text-slate-400">
                      BPM
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-slate-200/80 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">AI Analysis</p>
                  <p className="font-semibold text-slate-900 text-sm">
                    98% Accurate
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  const { t } = useTranslation();

  const stats = [
    { label: t("stats.reportsProcessed"), value: "10K+", icon: FileText },
    { label: t("stats.partnerLabs"), value: "50+", icon: Users },
    { label: t("stats.userRating"), value: "4.9/5", icon: Sparkles },
  ];

  return (
    <section className="py-20 md:py-28 bg-white border-t border-slate-200/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="font-heading text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase mb-10 text-center">
            02 — By the numbers
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center py-8 sm:py-10 px-6">
                <p className="font-heading text-4xl sm:text-5xl font-bold text-slate-900 mb-2 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      title: t("howItWorks.step1.title"),
      desc: t("howItWorks.step1.desc"),
      icon: UploadCloud,
      color: "blue",
    },
    {
      title: t("howItWorks.step2.title"),
      desc: t("howItWorks.step2.desc"),
      icon: Brain,
      color: "indigo",
    },
    {
      title: t("howItWorks.step3.title"),
      desc: t("howItWorks.step3.desc"),
      icon: LineChart,
      color: "purple",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#f8fafc]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <p className="font-heading text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase mb-4">
            {t("howItWorks.subtitle")}
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            {t("howItWorks.title")}
          </h2>
          <p className="text-slate-600">
            Simple, secure, and scientifically accurate
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Vertical line on desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200/80 -translate-x-px" />

            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-heading text-lg font-bold mb-6 relative z-10">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    step.color === "blue" && "bg-primary-100 text-primary-600",
                    step.color === "indigo" && "bg-indigo-100 text-indigo-600",
                    step.color === "purple" && "bg-purple-100 text-purple-600",
                  )}>
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t("features.feature1.title"),
      desc: t("features.feature1.desc"),
      icon: Zap,
      gradient: "from-yellow-400 to-orange-500",
    },
    {
      title: t("features.feature2.title"),
      desc: t("features.feature2.desc"),
      icon: LineChart,
      gradient: "from-green-400 to-emerald-500",
    },
    {
      title: t("features.feature3.title"),
      desc: t("features.feature3.desc"),
      icon: Users,
      gradient: "from-blue-400 to-indigo-500",
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 bg-white border-t border-slate-200/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="font-heading text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase mb-4">
            {t("features.subtitle")}
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            {t("features.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group">
              <div className="h-full rounded-xl p-8 border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300">
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center mb-6",
                    feature.gradient,
                  )}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TrustSection = () => {
  const { t } = useTranslation();

  const seals = [
    { icon: Shield, label: "HIPAA" },
    { icon: Lock, label: "ISO 27001" },
    { icon: Zap, label: "HL7 Compliant" },
  ];

  return (
    <section className="py-20 md:py-24 bg-[#f8fafc] border-t border-slate-200/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">
          <div className="text-center md:text-left">
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              {t("trust.title")}
            </h3>
            <p className="text-slate-600">
              {t("trust.security")}
            </p>
          </div>
          <div className="flex items-center gap-8 md:gap-12">
            {seals.map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-sm">
                  <item.icon className="w-6 h-6 text-slate-600" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 bg-slate-900 relative overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4 leading-tight tracking-tight">
              Ready to take control of your health?
            </h2>
            <p className="text-slate-400 mb-10 text-sm md:text-base">
              Join thousands making informed health decisions with AI-powered insights.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="font-heading w-full sm:w-auto px-6 py-3 text-base font-semibold rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-all"
                onClick={() => navigate("/auth")}>
                {t("cta.button")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Link
                to="/#features"
                className="text-slate-400 text-sm font-medium hover:text-white transition-colors flex items-center gap-1">
                {t("cta.link")}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

import { useAuthStore } from "@/store/authStore";

const Landing = () => {
  const { isAuthenticated, user, isProfileComplete } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      if (!isProfileComplete) {
        navigate("/profile-setup");
      } else if (user?.role === "admin") {
        navigate("/admin");
      } else if (user?.role === "doctor") {
        navigate("/doctor-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, isProfileComplete, navigate]);

  return (
    <div className="bg-white">
      <HeroSection />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}>
        <StatsSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}>
        <HowItWorks />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}>
        <Features />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}>
        <TrustSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}>
        <CTASection />
      </motion.div>
    </div>
  );
};

export default Landing;
