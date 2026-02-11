import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Users,
  ChevronRight,
  Play,
  CheckCircle2,
  FileText,
  Activity,
  LineChart,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-x-0 top-0 h-[800px] bg-gradient-to-b from-primary-50 to-white -z-10" />

      <div className="container-custom">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-bold mb-6">
                🚀 RapiReport v1.0 is Live
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6">
                {t("hero.title")}
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-10 rounded-2xl"
                  onClick={() => navigate("/auth")}>
                  {t("hero.cta")}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto rounded-2xl">
                  <Play className="mr-2 w-5 h-5 fill-current" />
                  {t("hero.demo")}
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success-500" />
                  Trusted by 50+ Labs
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative">
              <div className="aspect-[4/3] rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden group">
                {/* Mock UI */}
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-error-400" />
                    <div className="w-3 h-3 rounded-full bg-warning-400" />
                    <div className="w-3 h-3 rounded-full bg-success-400" />
                  </div>
                  <div className="text-xs font-bold text-gray-400">
                    RapiReport AI | Patient Stats
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100">
                      <p className="text-xs text-primary-600 font-bold mb-1">
                        HEMOGLOBIN
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        12.5 <span className="text-sm font-medium">g/dL</span>
                      </p>
                      <div className="mt-2 h-1.5 bg-primary-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full w-[70%]" />
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-warning-50 border border-warning-100">
                      <p className="text-xs text-warning-600 font-bold mb-1">
                        BLOOD SUGAR
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        110 <span className="text-sm font-medium">mg/dL</span>
                      </p>
                      <div className="mt-2 h-1.5 bg-warning-200 rounded-full overflow-hidden">
                        <div className="h-full bg-warning-600 rounded-full w-[40%]" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-4 bg-gray-100 rounded-full w-full" />
                    <div className="h-4 bg-gray-100 rounded-full w-5/6" />
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -bottom-6 -left-6 p-4 rounded-2xl glass-morphism shadow-xl animate-bounce duration-[3000ms]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-500 flex items-center justify-center text-white">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400">STATUS</p>
                    <p className="text-sm font-bold text-gray-900">
                      Health Verified
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
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
      color: "bg-primary-500",
      delay: 0.1,
    },
    {
      title: t("features.feature2.title"),
      desc: t("features.feature2.desc"),
      icon: LineChart,
      color: "bg-success-500",
      delay: 0.2,
    },
    {
      title: t("features.feature3.title"),
      desc: t("features.feature3.desc"),
      icon: Users,
      color: "bg-warning-500",
      delay: 0.3,
    },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
            {t("features.title")}
          </h2>
          <p className="text-lg text-gray-600 uppercase tracking-widest font-bold">
            Redefining Diagnostic Experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}>
              <Card hover className="h-full border-gray-100 group">
                <CardBody>
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-8 transition-transform group-hover:scale-110 shadow-lg",
                      feature.color,
                    )}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white">
      <HeroSection />

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
            <div>
              <p className="text-4xl md:text-6xl font-extrabold text-primary-500 mb-2">
                10K+
              </p>
              <p className="text-lg font-medium text-gray-400">
                Reports Processed
              </p>
            </div>
            <div>
              <p className="text-4xl md:text-6xl font-extrabold text-primary-500 mb-2">
                50+
              </p>
              <p className="text-lg font-medium text-gray-400">Partner Labs</p>
            </div>
            <div>
              <p className="text-4xl md:text-6xl font-extrabold text-primary-500 mb-2">
                4.9/5
              </p>
              <p className="text-lg font-medium text-gray-400">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      <Features />

      {/* CTA Section */}
      <section className="py-24 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="container-custom relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 max-w-4xl mx-auto leading-tight">
            Ready to make diagnostic reports helpful again?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto px-12 py-5 text-xl font-extrabold rounded-2xl border-none shadow-2xl hover:scale-105"
              onClick={() => navigate("/auth")}>
              Get Started Now
            </Button>
            <Link
              to="/#features"
              className="text-white font-bold border-b-2 border-white/40 hover:border-white transition-colors">
              Learn more about our AI
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
