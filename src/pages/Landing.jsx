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
  Activity,
  LineChart,
  Brain,
  UploadCloud,
  ArrowRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-32 overflow-hidden mesh-gradient">
      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100/50 backdrop-blur-md text-primary-700 text-sm font-bold mb-8 border border-primary-200/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                {t("hero.badge")}
              </motion.span>
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.05] mb-8 tracking-tighter">
                {t("hero.title")}
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-10 py-7 text-lg rounded-2xl shadow-2xl shadow-primary-200 hover:scale-105 transition-all"
                  onClick={() => navigate("/auth")}>
                  {t("hero.cta")}
                  <ChevronRight className="ml-2 w-6 h-6" />
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8 text-sm text-gray-500 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-success-100 text-success-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {t("hero.noCard")}
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-success-100 text-success-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {t("hero.trustedLabs")}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 w-full relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative z-20">
              {/* Main App Mockup Card */}
              <div className="relative rounded-[2.5rem] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-error-400" />
                    <div className="w-3.5 h-3.5 rounded-full bg-warning-400" />
                    <div className="w-3.5 h-3.5 rounded-full bg-success-400" />
                  </div>
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    {t("hero.mockTitle")}
                  </div>
                </div>
                <div className="p-10">
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="p-6 rounded-3xl bg-primary-50/50 border border-primary-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform">
                        <Activity className="w-12 h-12" />
                      </div>
                      <p className="text-[11px] text-primary-600 font-black tracking-widest mb-2">
                        {t("hero.hemoglobin")}
                      </p>
                      <p className="text-3xl font-black text-gray-900">
                        12.5{" "}
                        <span className="text-sm font-bold text-gray-400">
                          g/dL
                        </span>
                      </p>
                      <div className="mt-4 h-2 bg-primary-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "70%" }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className="h-full bg-primary-600 rounded-full"
                        />
                      </div>
                    </div>
                    <div className="p-6 rounded-3xl bg-warning-50/50 border border-warning-100 relative overflow-hidden group text-warning-900">
                      <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform">
                        <Shield className="w-12 h-12" />
                      </div>
                      <p className="text-[11px] text-warning-600 font-black tracking-widest mb-2">
                        {t("hero.bloodSugar")}
                      </p>
                      <p className="text-3xl font-black text-gray-900">
                        110{" "}
                        <span className="text-sm font-bold text-gray-400">
                          mg/dL
                        </span>
                      </p>
                      <div className="mt-4 h-2 bg-warning-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "40%" }}
                          transition={{ duration: 1.5, delay: 0.7 }}
                          className="h-full bg-warning-600 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="h-5 bg-gray-100/50 rounded-full w-4/5" />
                    <div className="h-5 bg-gray-100/50 rounded-full w-full" />
                    <div className="h-5 bg-gray-100/50 rounded-full w-3/4" />
                  </div>
                </div>
              </div>

              {/* Floating Glass Cards */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-12 -right-12 p-6 rounded-3xl glass-morphism shadow-2xl z-30 border-white/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Brain className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-0.5">
                      AI Insights
                    </p>
                    <p className="text-sm font-black text-gray-900 leading-none">
                      Report Analyzed
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-10 -left-12 p-6 rounded-3xl glass-morphism shadow-2xl z-30 border-white/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-success-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-success-600 uppercase tracking-widest mb-0.5">
                      {t("hero.status")}
                    </p>
                    <p className="text-sm font-black text-gray-900 leading-none">
                      {t("hero.healthVerified")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary-100/30 blur-[120px] rounded-full -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  const { t } = useTranslation();

  const stats = [
    {
      label: t("stats.reportsProcessed"),
      value: "10K+",
      color: "from-primary-600 to-indigo-600",
    },
    {
      label: t("stats.partnerLabs"),
      value: "50+",
      color: "from-indigo-600 to-primary-600",
    },
    {
      label: t("stats.userRating"),
      value: "4.9/5",
      color: "from-primary-600 to-indigo-600",
    },
  ];

  return (
    <section className="relative py-20 bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[100px]" />
      </div>
      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}>
              <p
                className={cn(
                  "text-5xl md:text-7xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r",
                  stat.color,
                )}>
                {stat.value}
              </p>
              <p className="text-lg font-bold text-gray-400 uppercase tracking-widest">
                {stat.label}
              </p>
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
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: t("howItWorks.step2.title"),
      desc: t("howItWorks.step2.desc"),
      icon: Brain,
      gradient: "from-primary-500 to-indigo-600",
    },
    {
      title: t("howItWorks.step3.title"),
      desc: t("howItWorks.step3.desc"),
      icon: LineChart,
      gradient: "from-success-500 to-emerald-600",
    },
  ];

  return (
    <section className="py-32 bg-slate-50 relative">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            {t("howItWorks.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-primary-600 uppercase tracking-[0.3em] font-black">
            {t("howItWorks.subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent -translate-y-1/2" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="relative z-10">
              <div className="flex flex-col items-center text-center group">
                <div
                  className={cn(
                    "w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 bg-gradient-to-br",
                    step.gradient,
                  )}>
                  <step.icon className="w-10 h-10" />
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-900 font-black text-lg border-4 border-slate-50">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight group-hover:text-primary-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-500 leading-relaxed font-medium max-w-[280px]">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
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
      color: "from-primary-500 to-indigo-600",
      delay: 0.1,
    },
    {
      title: t("features.feature2.title"),
      desc: t("features.feature2.desc"),
      icon: LineChart,
      color: "from-success-500 to-emerald-600",
      delay: 0.2,
    },
    {
      title: t("features.feature3.title"),
      desc: t("features.feature3.desc"),
      icon: Users,
      color: "from-warning-500 to-orange-600",
      delay: 0.3,
    },
  ];

  return (
    <section id="features" className="py-32 bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
            {t("features.title")}
          </h2>
          <p className="text-lg text-primary-600 uppercase tracking-[0.3em] font-black">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}>
              <div className="h-full p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:border-primary-100 hover:bg-white hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)] transition-all duration-500 group">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 transition-all group-hover:scale-110 group-hover:-rotate-3 shadow-xl bg-gradient-to-br",
                    feature.color,
                  )}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed font-medium">
                  {feature.desc}
                </p>
                <div className="mt-8 flex items-center gap-2 text-primary-600 font-bold opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  Read more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="bg-white">
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <Features />

      {/* Trust Section */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                {t("trust.title")}
              </h3>
              <p className="text-gray-500 font-medium">{t("trust.security")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="flex items-center gap-2 font-black text-gray-400">
                <Shield className="w-8 h-8" />
                HIPAA
              </div>
              <div className="flex items-center gap-2 font-black text-gray-400">
                <Shield className="w-8 h-8" />
                ISO 27001
              </div>
              <div className="flex items-center gap-2 font-black text-gray-400">
                <Activity className="w-8 h-8" />
                HL7
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="container-custom relative z-10 text-center">
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-7xl font-black text-white mb-10 max-w-5xl mx-auto leading-[1.1] tracking-tighter">
            {t("cta.title")}
          </motion.h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto px-16 py-8 text-2xl font-black rounded-[2rem] bg-white text-primary-600 border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all"
              onClick={() => navigate("/auth")}>
              {t("cta.button")}
            </Button>
            <Link
              to="/#features"
              className="text-white/80 text-lg font-bold border-b-2 border-white/20 hover:border-white hover:text-white transition-all py-1">
              {t("cta.link")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
