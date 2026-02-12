import React, { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, User, Calendar, Clock, DollarSign, Download, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import API from "@/Configs/ApiEndpoints";
import { useAuthStore } from "@/store/authStore";

const DoctorTransactions = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(API.DOCTOR_TRANSACTIONS, { withCredentials: true });
            if (res.data.status === "success") {
                setTransactions(res.data.transactions);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        Financial History
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Track your earnings and consultation payments</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
            </div>

            <Card className="border-none shadow-xl shadow-gray-100/50">
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Patient</th>
                                    <th className="text-left py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                                    <th className="text-left py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Transaction ID</th>
                                    <th className="text-left py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="text-left py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No transactions found.</td></tr>
                                ) : (
                                    transactions.map((tx, i) => (
                                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                        {tx.patient_avatar ? (
                                                            <img src={tx.patient_avatar} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-gray-900">{tx.patient_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-gray-400" />{tx.appointment_date}</span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-1"><Clock className="w-3 h-3" />{tx.appointment_time_slot}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-mono text-xs text-gray-500">{tx.transaction_uuid}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-black text-gray-900">Rs. {tx.amount}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                                    ${tx.payment_status === 'completed' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'}
                                                `}>
                                                    {tx.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default DoctorTransactions;
