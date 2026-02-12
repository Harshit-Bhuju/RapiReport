import React from "react";
import { CheckCircle2, Calendar, ArrowRight, Home } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useNavigate, useSearchParams } from "react-router-dom";

const BookingSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get("appointment_id");

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in zoom-in duration-500">
            <Card className="border-none shadow-2xl shadow-primary-100 overflow-hidden rounded-[2.5rem] bg-white text-center">
                <div className="h-3 bg-primary-600 w-full" />
                <CardBody className="p-12">
                    <div className="w-24 h-24 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 className="w-12 h-12 text-success-600" />
                    </div>

                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Payment Successful!</h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed mb-10">
                        Your appointment has been confirmed. A medical specialist will be waiting for you at the scheduled time.
                    </p>

                    <div className="bg-gray-50 rounded-3xl p-6 mb-10 border border-gray-100/50">
                        <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                            <Calendar className="w-4 h-4" />
                            Appointment Reference
                        </div>
                        <p className="text-xl font-black text-gray-900">#{appointmentId || "N/A"}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                            onClick={() => navigate("/dashboard")}
                            variant="secondary"
                            className="py-4 rounded-2xl font-black uppercase tracking-widest text-xs border-2 gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Go to Dashboard
                        </Button>
                        <Button
                            onClick={() => navigate("/appointments")} // This page will show list of appointments
                            className="py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary-600 text-white shadow-xl shadow-primary-200 gap-2"
                        >
                            View Appointments
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardBody>
            </Card>

            <p className="text-center text-gray-400 font-medium text-sm mt-8">
                A confirmation email has been sent to your registered address.
            </p>
        </div>
    );
};

export default BookingSuccess;
