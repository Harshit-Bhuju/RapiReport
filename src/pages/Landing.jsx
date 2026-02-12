import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Users,
  ChevronRight,
  CheckCircle2,
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
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-blue-200/50 text-blue-600 text-sm font-semibold mb-8 shadow-sm">
                <Sparkles className="w-4 h-4" />
                {t("hero.badge")}
              </span>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-[1.1]">
                {t("hero.title").split(" ").slice(0, 2).join(" ")}
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {t("hero.title").split(" ").slice(2).join(" ")}
                </span>
              </h1>

              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t("hero.subtitle")}
              </p>

              <div className="flex justify-center mb-12">
                <Button
                  size="lg"
                  className="px-10 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
                  onClick={() => navigate("/auth")}>
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md">
                      <img
                        src={`https://i.pravatar.cc/150?u=${i + 20}`}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600">
                  Trusted by{" "}
                  <span className="font-semibold text-slate-900">10,000+</span>{" "}
                  users
                </p>
              </div>
            </motion.div>
          </div>

          {/* Hero Image/Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-6xl mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/50 bg-white">
              {/* Browser Chrome */}
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
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
              <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-white to-slate-50">
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
              animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -left-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20 hidden lg:block z-30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Activity className="w-6 h-6 text-white" />
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
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-white rounded-xl p-3 sm:p-4 shadow-xl border border-slate-200/50 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
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
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/50">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
            </motion.div>
          ))}
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
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-4 block">
              {t("howItWorks.subtitle")}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {t("howItWorks.title")}
            </h2>
            <p className="text-xl text-slate-600">
              Simple, secure, and scientifically accurate
            </p>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connection Line - hidden on mobile */}
            <div
              className="hidden md:block absolute left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"
              style={{ top: "4rem" }}
            />

            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all hover:-translate-y-1 relative z-10">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto",
                      step.color === "blue" &&
                        "bg-gradient-to-br from-blue-500 to-blue-600",
                      step.color === "indigo" &&
                        "bg-gradient-to-br from-indigo-500 to-indigo-600",
                      step.color === "purple" &&
                        "bg-gradient-to-br from-purple-500 to-purple-600",
                    )}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                    {idx + 1}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-center">
                    {step.desc}
                  </p>
                </div>
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
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-4 block">
              {t("features.subtitle")}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {t("features.title")}
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group">
              <div className="h-full bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border border-slate-200/50 hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group">
                {/* Subtle "Data Processing" bar - only visible on hover */}
                <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-full scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />

                <div
                  className={cn(
                    "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform",
                    feature.gradient,
                  )}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {feature.desc}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <button className="text-blue-600 font-semibold flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </button>
                  {/* Heartbeat pulse icon */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-blue-400/30 opacity-0 group-hover:opacity-100"
                  />
                </div>
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

  return (
    <section className="py-16 md:py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-slate-200/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                  {t("trust.title")}
                </h3>
                <p className="text-slate-600 text-base md:text-lg">
                  {t("trust.security")}
                </p>
              </div>
              <div className="flex items-center gap-6 md:gap-8 flex-wrap justify-center">
                {[
                  { icon: Shield, label: "HIPAA", color: "blue" },
                  { icon: Lock, label: "ISO 27001", color: "green" },
                  { icon: Zap, label: "HL7 Compliant", color: "purple" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center gap-2 group/seal">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover/seal:-translate-y-1",
                        item.color === "blue" &&
                          "bg-blue-100 text-blue-600 shadow-blue-100",
                        item.color === "green" &&
                          "bg-green-100 text-green-600 shadow-green-100",
                        item.color === "purple" &&
                          "bg-purple-100 text-purple-600 shadow-purple-100",
                      )}>
                      <item.icon className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/seal:text-slate-900 transition-colors">
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
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
    <section className="py-20 md:py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight px-4">
              Ready to take control of your health?
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto px-4">
              Join thousands of users who are making informed health decisions
              with AI-powered insights
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold rounded-xl bg-white text-blue-600 hover:bg-slate-50 shadow-xl hover:shadow-2xl transition-all"
                onClick={() => navigate("/auth")}>
                {t("cta.button")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link
                to="/#features"
                className="text-white font-medium hover:text-blue-100 transition-colors flex items-center gap-2">
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

const Landing = () => {
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
