import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Stethoscope,
  Briefcase,
  Clock,
  Star,
  ChevronRight,
  Filter,
  ShieldCheck,
  Calendar,
  Award,
  MapPin,
  Heart,
  TrendingUp,
  Grid3x3,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "@/Configs/ApiEndpoints";
import Select from "@/components/ui/Select";

const SPECIALTIES = [
  "All",
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

const Consultants = () => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'compact'
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(API.CONSULTANTS_LIST, {
        withCredentials: true,
      });
      if (res.data.status === "success") {
        setDoctors(res.data.doctors);
      }
    } catch (error) {
      toast.error("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  const specialties = ["All", ...new Set(doctors.map((d) => d.specialty))];

  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.username.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty =
      specialtyFilter === "All" || d.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookNow = (doctor) => {
    navigate("/booking", { state: { doctor } });
  };

  // Skeleton Loading Component
  const SkeletonCard = ({ compact = false }) => (
    <div
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${compact ? "h-[160px]" : "h-[420px]"
        }`}
    >
      <div className="animate-pulse">
        {!compact && <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-100" />}
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          {!compact && (
            <>
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Compact Card Component
  const CompactDoctorCard = ({ doc }) => (
    <div className="group bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Avatar Section */}
        <div className="relative flex-shrink-0">
          {doc.profile_pic ? (
            <img
              src={doc.profile_pic}
              alt={doc.display_name || doc.username}
              className="w-20 h-20 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-primary-200 transition-all"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center ring-2 ring-gray-100 group-hover:ring-primary-200 transition-all">
              <Stethoscope className="w-10 h-10 text-primary-600" />
            </div>
          )}
          <div className="absolute -top-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-primary-600 transition-colors">
            {doc.display_name || doc.username}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-[10px] font-semibold">
              <Stethoscope className="w-3 h-3" />
              {doc.specialty}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {doc.experience_years}y
            </span>
            <span className="flex items-center gap-1 font-semibold text-primary-600">
              <span className="text-[10px]">Rs.</span> {doc.consultation_rate}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/consultant-profile/${doc.id}`)}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition-all"
          >
            View
          </button>
          <button
            onClick={() => handleBookNow(doc)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-all flex items-center gap-1"
          >
            Book <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );

  // Standard Card Component
  const StandardDoctorCard = ({ doc }) => (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-primary-200 transition-all duration-500">
      {/* Image Section with Overlay */}
      <div className="relative h-48 overflow-hidden">
        {doc.profile_pic ? (
          <img
            src={doc.profile_pic}
            alt={doc.display_name || doc.username}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 flex items-center justify-center">
            <Stethoscope className="w-20 h-20 text-white/30" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Specialty Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-primary-700 text-[10px] font-bold shadow-lg">
            <Sparkles className="w-3 h-3" />
            {doc.specialty}
          </span>
        </div>

        {/* Verified Badge */}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Doctor Name & Rating */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-primary-600 transition-colors">
              {doc.display_name || doc.username}
            </h3>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Briefcase className="w-4 h-4 text-primary-500" />
            <span className="font-semibold">{doc.experience_years}</span>
            <span className="text-gray-400">{t("consultantsPage.years")} Exp.</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="font-bold text-green-600">Available</span>
          </div>
        </div>

        {/* Consultation Fee */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500 font-medium">
            {t("consultantsPage.fee")}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-gray-500">Rs.</span>
            <span className="text-2xl font-bold text-primary-600">
              {doc.consultation_rate}
            </span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">
          {doc.bio || t("consultantsPage.noDesc")}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/consultant-profile/${doc.id}`)}
            className="flex-1 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-widest border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            {t("consultantsPage.viewProfile")}
          </button>
          <button
            onClick={() => handleBookNow(doc)}
            className="flex-[1.5] rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 transition-all flex items-center justify-center gap-2 group/btn"
          >
            {t("consultantsPage.bookNow")}
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Premium Header */}
        <div className="relative mb-12 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />

          <div className="relative px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                {t("consultantsPage.verifiedTitle")}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              {t("consultantsPage.title")}
            </h1>

            <p className="text-white/90 text-base max-w-2xl leading-relaxed">
              {t("consultantsPage.subtitle")}
            </p>

            {/* Stats */}
            <div className="flex gap-8 mt-8">
              <div className="text-white/90">
                <div className="text-3xl font-black text-white">{doctors.length}+</div>
                <div className="text-sm">Specialists</div>
              </div>
              <div className="text-white/90">
                <div className="text-3xl font-black text-white">24/7</div>
                <div className="text-sm">Available</div>
              </div>
              <div className="text-white/90">
                <div className="text-3xl font-black text-white">24/7</div>
                <div className="text-sm">Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("consultantsPage.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all"
              />
            </div>

            {/* Specialty Filter */}
            <div className="w-full lg:w-64">
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all"
              >
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Specialties" : s}
                  </option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-lg transition-all ${viewMode === "grid"
                  ? "bg-white shadow-sm text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={`p-3 rounded-lg transition-all ${viewMode === "compact"
                  ? "bg-white shadow-sm text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(search || specialtyFilter !== "All") && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-500">Active Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                  Search: "{search}"
                  <button onClick={() => setSearch("")} className="ml-1 hover:bg-primary-100 rounded-full p-0.5">
                    ×
                  </button>
                </span>
              )}
              {specialtyFilter !== "All" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                  {specialtyFilter}
                  <button onClick={() => setSpecialtyFilter("All")} className="ml-1 hover:bg-primary-100 rounded-full p-0.5">
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-bold text-gray-900">{filteredDoctors.length}</span> specialists
            </p>
          </div>
        )}

        {/* Doctors Grid */}
        <div
          className={`grid gap-6 ${viewMode === "compact"
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
        >
          {loading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} compact={viewMode === "compact"} />
              ))}
            </>
          ) : filteredDoctors.length === 0 ? (
            <div className="col-span-full">
              <div className="text-center py-16 px-4">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("consultantsPage.noSpecialists")}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {t("consultantsPage.noSpecialistsDesc")}
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSpecialtyFilter("All");
                  }}
                  className="mt-6 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              {filteredDoctors.map((doc) =>
                viewMode === "compact" ? (
                  <CompactDoctorCard key={doc.id} doc={doc} />
                ) : (
                  <StandardDoctorCard key={doc.id} doc={doc} />
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Consultants;