import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
    ChevronRight
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import API from "@/Configs/ApiEndpoints";

const Booking = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { doctor } = location.state || {};

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!doctor) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-16 h-16 text-error-400 mb-4" />
                <h2 className="text-2xl font-black text-gray-900">No Doctor Selected</h2>
                <p className="text-gray-500 mt-2 mb-8">Please select a doctor from the specialists list.</p>
                <Button onClick={() => navigate("/consultants")}>Go to Specialists</Button>
            </div>
        );
    }

    const timeSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM",
        "02:00 PM", "03:00 PM", "04:00 PM"
    ];

    const handleBooking = async () => {
        if (!selectedDate || !selectedSlot) {
            toast.error("Please select a date and time slot.");
            return;
        }

        setIsSubmitting(true);
        try {
            // This will call the backend API that initiates eSewa payment
            // Following CultureConnect Pattern
            const response = await axios.post(API.ESEWA_INITIATE, {
                doctor_user_id: doctor.id,
                appointment_date: selectedDate,
                appointment_time_slot: selectedSlot,
                consultation_fee: doctor.consultation_rate,
                notes: notes
            }, { withCredentials: true });

            if (response.data.status === "redirect" && response.data.url) {
                // For eSewa, the backend might return a form or a URL to redirect to
                window.location.href = response.data.url;
            } else if (response.data.status === "success" && response.data.html) {
                // If it returns the eSewa hidden form (CultureConnect pattern)
                const div = document.createElement('div');
                div.innerHTML = response.data.html;
                document.body.appendChild(div);
                div.querySelector('form').submit();
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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Specialists
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Booking Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl shadow-gray-100/50">
                        <CardBody className="p-8">
                            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                <CalendarIcon className="w-6 h-6 text-primary-600" />
                                Select Appointment
                            </h2>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Choose Date</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-primary-500 focus:outline-none transition-all font-bold text-gray-900 bg-gray-50/50 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Available Slots</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {timeSlots.map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`py-3.5 px-4 rounded-xl text-sm font-bold transition-all border-2 ${selectedSlot === slot
                                                    ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200"
                                                    : "bg-white text-gray-600 border-gray-100 hover:border-primary-200"
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Consultation Notes (Optional)</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                        <textarea
                                            placeholder="Tell the doctor about your condition..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows="4"
                                            className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-primary-500 focus:outline-none transition-all font-medium text-gray-900 bg-gray-50/50 focus:bg-white resize-none"
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
                        <CardBody className="p-8">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Order Summary</h3>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 mb-8">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden border border-primary-200 text-primary-600">
                                    {doctor.profile_pic ? (
                                        <img src={doctor.profile_pic} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-black text-gray-900">{doctor.username}</p>
                                    <p className="text-xs text-gray-500 font-bold">{doctor.specialty}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Consultation Fee</span>
                                    <span className="text-gray-900 font-black">Rs. {doctor.consultation_rate}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Service Charge</span>
                                    <span className="text-gray-900 font-black">Rs. 0.00</span>
                                </div>
                                <div className="pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Amount</p>
                                        <p className="text-3xl font-black text-primary-600 leading-none">
                                            <span className="text-base mr-1">Rs.</span>
                                            {doctor.consultation_rate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-success-50 border-2 border-success-100 mb-8 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-success-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-success-700 leading-relaxed uppercase tracking-wider">
                                    Secure Payment via eSewa Gateway. Your transaction is protected.
                                </p>
                            </div>

                            <Button
                                onClick={handleBooking}
                                disabled={isSubmitting || !selectedDate || !selectedSlot}
                                className="w-full py-5 rounded-2xl font-black uppercase tracking-widest bg-primary-600 text-white shadow-2xl shadow-primary-200 hover:bg-primary-700 gap-3 group/pay"
                            >
                                {isSubmitting ? (
                                    "Processing..."
                                ) : (
                                    <>
                                        <span className="group-hover/pay:scale-110 transition-transform">Pay via eSewa</span>
                                        <ChevronRight className="w-5 h-5 group-hover/pay:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <div className="mt-6 flex items-center justify-center gap-2 grayscale opacity-50">
                                <CreditCard className="w-4 h-4" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">eSewa NP</span>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Booking;
