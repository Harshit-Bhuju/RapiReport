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

    const [timeSlots, setTimeSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [step, setStep] = useState(1); // 1: Selection, 2: Confirmation

    React.useEffect(() => {
        if (!doctor?.availability_json || !selectedDate) return;

        const fetchBookedSlots = async () => {
            try {
                const res = await axios.get(`${API.DOCTOR_SLOTS}?doctor_id=${doctor.id}&date=${selectedDate}`, { withCredentials: true });
                if (res.data.status === "success") {
                    setBookedSlots(res.data.booked_slots);
                }
            } catch (error) {
                console.error("Failed to fetch booked slots", error);
            }
        };

        fetchBookedSlots();

        const date = new Date(selectedDate);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        const availability = doctor.availability_json.find(d => d.day === dayName);

        if (availability) {
            const slots = generateSlots(availability.startTime, availability.endTime);
            // Filter past slots if today
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            if (selectedDate === todayStr) {
                const filtered = slots.filter(slot => {
                    const slotDate = new Date(`${todayStr} ${slot}`);
                    return slotDate > now;
                });
                setTimeSlots(filtered);
            } else {
                setTimeSlots(slots);
            }
        } else {
            setTimeSlots([]);
        }
    }, [selectedDate, doctor]);

    const generateSlots = (start, end) => {
        const slots = [];
        let current = new Date(`2000-01-01 ${start}`);
        const endTime = new Date(`2000-01-01 ${end}`);

        while (current < endTime) {
            slots.push(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
            current.setMinutes(current.getMinutes() + 60); // 1 hour slots
        }
        return slots;
    };

    const handleConfirmSchedule = () => {
        if (!selectedDate || !selectedSlot) {
            toast.error("Please select a date and time slot.");
            return;
        }
        setStep(2);
    };

    const handleChangeDay = () => {
        setStep(1);
    };

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

    if (step === 2) {
        return (
            <div className="max-w-xl mx-auto py-10 animate-in fade-in zoom-in-95 duration-300">
                <Card className="border-none shadow-2xl shadow-primary-100/50">
                    <CardBody className="p-8 text-center">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Confirm Schedule</h2>
                        <p className="text-gray-500 font-medium mb-8">Please review your appointment details before proceeding to payment.</p>

                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left space-y-4 border border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date</span>
                                <span className="text-sm font-black text-gray-900">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Time</span>
                                <span className="text-sm font-black text-gray-900">{selectedSlot}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Consultation Fee</span>
                                <span className="text-lg font-black text-primary-600">Rs. {doctor.consultation_rate}</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={handleChangeDay} className="flex-1 py-4">
                                Change Day
                            </Button>
                            <Button onClick={handleBooking} loading={isSubmitting} className="flex-1 py-4 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200">
                                Accept & Pay
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

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
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Choose Day (This Week)</label>
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {doctor.availability_json && doctor.availability_json.length > 0 ? (
                                            (() => {
                                                const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                                const todayIndex = new Date().getDay();

                                                // Create a map of available days with their next dates
                                                const availableDays = doctor.availability_json.map(schedule => {
                                                    const targetIndex = daysOrder.indexOf(schedule.day);
                                                    let diff = targetIndex - todayIndex;
                                                    if (diff < 0) diff += 7; // If day passed this week, move to next week? User said "for this week only".
                                                    // "appoint for a week only" usually means "next 7 days".
                                                    // If today is Friday, and user picks Monday, that's next week (within 7 days).

                                                    const date = new Date();
                                                    date.setDate(date.getDate() + diff);
                                                    const dateStr = date.toISOString().split('T')[0];

                                                    return { ...schedule, date: dateStr, diff };
                                                })
                                                    .sort((a, b) => a.diff - b.diff); // Sort by nearness to today

                                                return availableDays.map((schedule, idx) => {
                                                    const isSelected = selectedDate === schedule.date;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedDate(schedule.date);
                                                                setSelectedSlot("");
                                                            }}
                                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all min-w-[100px] ${isSelected
                                                                ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200"
                                                                : "bg-white text-gray-600 border-gray-100 hover:border-primary-200 hover:bg-primary-50"
                                                                }`}
                                                        >
                                                            <span className="text-sm font-black uppercase tracking-wider">
                                                                {schedule.diff === 0 ? "Today" : schedule.day.slice(0, 3)}
                                                            </span>
                                                            <span className="text-xs opacity-80 font-bold">
                                                                {new Date(schedule.date).getDate()} {new Date(schedule.date).toLocaleString('default', { month: 'short' })}
                                                            </span>
                                                        </button>
                                                    );
                                                });
                                            })()
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No availability set by doctor.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Available Slots</label>
                                    {timeSlots.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {timeSlots.map(slot => {
                                                const isBooked = bookedSlots.includes(slot);
                                                return (
                                                    <button
                                                        key={slot}
                                                        onClick={() => !isBooked && setSelectedSlot(slot)}
                                                        disabled={isBooked}
                                                        className={`py-3.5 px-4 rounded-xl text-sm font-bold transition-all border-2 relative ${isBooked
                                                            ? "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed decoration-slice"
                                                            : selectedSlot === slot
                                                                ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200"
                                                                : "bg-white text-gray-600 border-gray-100 hover:border-primary-200"
                                                            }`}
                                                    >
                                                        {slot}
                                                        {isBooked && <span className="absolute -top-2 -right-2 bg-error-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest">Booked</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">
                                            {selectedDate ? "No available slots for this date." : "Please select a date first."}
                                        </p>
                                    )}
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

                            <Button
                                onClick={handleConfirmSchedule}
                                disabled={isSubmitting || !selectedDate || !selectedSlot}
                                className="w-full py-5 rounded-2xl font-black uppercase tracking-widest bg-primary-600 text-white shadow-2xl shadow-primary-200 hover:bg-primary-700 gap-3 group/pay"
                            >
                                Continue
                                <ChevronRight className="w-5 h-5 group-hover/pay:translate-x-1 transition-transform" />
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Booking;
