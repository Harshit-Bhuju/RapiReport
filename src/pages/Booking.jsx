import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  MessageSquare,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import API from "@/Configs/ApiEndpoints";

const Booking = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { doctor } = location.state || {};

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (doctor?.availability_json) {
      const today = new Date();
      const availability = Array.isArray(doctor.availability_json) ? doctor.availability_json : [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        if (availability.some(slot => slot.day === dayName)) {
          setSelectedDate(date.toISOString().split('T')[0]);
          break;
        }
      }
    }
  }, [doctor]);

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-16 h-16 text-error-400 mb-4" />
        <h2 className="text-2xl font-black text-gray-900">
          {t("booking.noDoctor")}
        </h2>
        <p className="text-gray-500 mt-2 mb-8">{t("booking.noDoctorDesc")}</p>
        <Button onClick={() => navigate("/consultants")}>
          {t("booking.backSpecialists")}
        </Button>
      </div>
    );
  }

  const getTimeSlots = () => {
    if (!selectedDate || !doctor.availability_json) return [];

    const dayName = new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" });
    const dayAvailability = doctor.availability_json.find(a => a.day === dayName);

    if (!dayAvailability) return [];

    // If availability already has specific slots, use them
    if (dayAvailability.slots) return dayAvailability.slots;

    // Otherwise generate slots between startTime and endTime (e.g., "09:00 AM" to "05:00 PM")
    const slots = [];
    const start = parseInt(dayAvailability.startTime?.split(":")[0]) || 9;
    const end = parseInt(dayAvailability.endTime?.split(":")[0]) || 17;

    for (let h = start; h < end; h++) {
      const hour = h % 12 || 12;
      const ampm = h < 12 ? "AM" : "PM";
      slots.push(`${hour.toString().padStart(2, "0")}:00 ${ampm}`);
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error(t("booking.errorSlot"));
      return;
    }

    setIsSubmitting(true);
    try {
      // This will call the backend API that initiates eSewa payment
      // Following CultureConnect Pattern
      const response = await axios.post(
        API.ESEWA_INITIATE,
        {
          doctor_user_id: doctor.id,
          appointment_date: selectedDate,
          appointment_time_slot: selectedSlot,
          consultation_fee: doctor.consultation_rate,
          notes: notes,
        },
        { withCredentials: true },
      );

      if (response.data.status === "redirect" && response.data.url) {
        // For eSewa, the backend might return a form or a URL to redirect to
        window.location.href = response.data.url;
      } else if (response.data.status === "success" && response.data.html) {
        // If it returns the eSewa hidden form (CultureConnect pattern)
        const div = document.createElement("div");
        div.innerHTML = response.data.html;
        document.body.appendChild(div);
        div.querySelector("form").submit();
      } else {
        toast.error(response.data.message || "Failed to initiate payment.");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        {t("booking.backSpecialists")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-5">
              <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary-600" />
                {t("booking.selectAppointment")}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    {t("booking.chooseDate")}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(() => {
                      const days = [];
                      const today = new Date();
                      const availability = Array.isArray(doctor.availability_json) ? doctor.availability_json : [];

                      for (let i = 0; i < 7; i++) {
                        const date = new Date(today);
                        date.setDate(today.getDate() + i);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                        const dateString = date.toISOString().split('T')[0];

                        // Check if doctor is available on this day
                        const isAvailable = availability.some(slot => slot.day === dayName);

                        if (isAvailable) {
                          days.push({
                            date: dateString,
                            dayName: dayName,
                            displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          });
                        }
                      }

                      if (days.length === 0) {
                        return <p className="col-span-full text-sm text-gray-500 italic">No available days in the next 7 days.</p>;
                      }

                      return days.map((day) => (
                        <button
                          key={day.date}
                          onClick={() => setSelectedDate(day.date)}
                          className={`flex flex-col items-center py-2 px-2 rounded-xl text-center transition-all border-2 ${selectedDate === day.date
                            ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200"
                            : "bg-white text-gray-600 border-gray-100 hover:border-primary-200"
                            }`}>
                          <span className="text-[10px] uppercase font-black opacity-80">{day.dayName.substring(0, 3)}</span>
                          <span className="text-xs font-bold">{day.displayDate}</span>
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    {t("booking.availableSlots")}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-2 ${selectedSlot === slot
                          ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200"
                          : "bg-white text-gray-600 border-gray-100 hover:border-primary-200"
                          }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    {t("booking.consultationNotes")}
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                    <textarea
                      placeholder={t("booking.placeholderNotes")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="3"
                      className="w-full pl-10 pr-5 py-3 rounded-xl border-2 border-gray-100 focus:border-primary-500 focus:outline-none transition-all font-medium text-sm text-gray-900 bg-gray-50/50 focus:bg-white resize-none"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Summary & Checkout */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50 bg-white">
            <CardBody className="p-6">
              <h3 className="text-lg font-black text-gray-900 mb-5">
                {t("booking.orderSummary")}
              </h3>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden border border-primary-200 text-primary-600">
                  {doctor.profile_pic ? (
                    <img
                      src={doctor.profile_pic}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{doctor.username}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {doctor.specialty}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>{t("booking.consultationFee")}</span>
                  <span className="text-gray-900 font-black">
                    {t("booking.rs")} {doctor.consultation_rate}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>{t("booking.serviceCharge")}</span>
                  <span className="text-gray-900 font-black">
                    {t("booking.rs")} 0.00
                  </span>
                </div>
                <div className="pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                      {t("booking.totalAmount")}
                    </p>
                    <p className="text-2xl font-black text-primary-600 leading-none">
                      <span className="text-sm mr-1">{t("booking.rs")}</span>
                      {doctor.consultation_rate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-success-50 border-2 border-success-100 mb-6 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-success-600 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-success-700 leading-relaxed uppercase tracking-wider">
                  {t("booking.securePayment")}
                </p>
              </div>

              <Button
                onClick={handleBooking}
                disabled={isSubmitting || !selectedDate || !selectedSlot}
                className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest bg-primary-600 text-white shadow-xl shadow-primary-100 hover:bg-primary-700 gap-2 group/pay text-xs">
                {isSubmitting ? (
                  <span className="truncate">{t("common.processing")}</span>
                ) : (
                  <>
                    <span className="truncate group-hover/pay:scale-105 transition-transform">
                      {t("booking.payViaEsewa")}
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover/pay:translate-x-1 transition-transform flex-shrink-0" />
                  </>
                )}
              </Button>

              <div className="mt-5 flex items-center justify-center gap-2 grayscale opacity-50">
                <CreditCard className="w-3 h-3" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  eSewa NP
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Booking;
