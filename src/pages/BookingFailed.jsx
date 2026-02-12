import React from "react";
import { AlertCircle, RefreshCw, ArrowLeft, Home } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useNavigate, useSearchParams } from "react-router-dom";

const BookingFailed = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const errorMsg = searchParams.get("error") || "The payment process could not be completed.";

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in zoom-in duration-500">
            <Card className="border-none shadow-2xl shadow-error-100 overflow-hidden rounded-[2.5rem] bg-white text-center">
                <div className="h-3 bg-error-500 w-full" />
                <CardBody className="p-12">
                    <div className="w-24 h-24 bg-error-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <AlertCircle className="w-12 h-12 text-error-600" />
                    </div>

                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Payment Failed</h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed mb-10">
                        {errorMsg}
                    </p>

                    <div className="bg-gray-50 rounded-3xl p-6 mb-10 border border-gray-100/50">
                        <p className="text-sm font-bold text-gray-500 italic">
                            "If funds were deducted from your account, they will be refunded within 3-5 business days."
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                            onClick={() => navigate("/consultants")}
                            variant="secondary"
                            className="py-4 rounded-2xl font-black uppercase tracking-widest text-xs border-2 gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Try Again
                        </Button>
                        <Button
                            onClick={() => navigate("/dashboard")}
                            className="py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-gray-900 text-white shadow-xl shadow-gray-200 gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Dashboard
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default BookingFailed;
