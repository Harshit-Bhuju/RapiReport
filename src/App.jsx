import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";

// Layout
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Loading from "@/components/ui/Loading";
import {
  ProtectedRoute,
  PublicRoute,
  FlowRoute,
  RoleRoute,
} from "@/components/layout/RouteGuards";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Results from "@/pages/Results";
import Reports from "@/pages/Reports";
import Consultation from "@/pages/Consultation";
import Consultants from "@/pages/Consultants";
import Booking from "@/pages/Booking";
import BookingSuccess from "@/pages/BookingSuccess";
import BookingFailed from "@/pages/BookingFailed";
import MyAppointments from "@/pages/MyAppointments";
import UserAppointments from "@/pages/UserAppointments";
import RiskAnalysis from "@/pages/RiskAnalysis";



import HealthPlanner from "@/pages/HealthPlanner";
import NotFound from "@/pages/NotFound";
import DoctorConsultation from "@/pages/DoctorConsultation";
import QuestGame from "@/pages/QuestGame";
import Family from "@/pages/Family";
import Profile from "@/pages/Profile";
import { AdminPanel, AdminLayout, ConsultantsManagement } from "@/pages/admin";
import { DoctorDashboard, DoctorProfile, DoctorLayout, DoctorTransactions, DoctorAppointments } from "@/pages/doctor";
import ConsultationRoom from "@/pages/ConsultationRoom";
import ConsultantProfile from "@/pages/ConsultantProfile";
import ProfileSetup from "@/components/features/ProfileSetup";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PrescriptionScan from "@/pages/health/PrescriptionScan";
import Symptoms from "@/pages/health/Symptoms";

import Marketplace from "@/pages/health/Marketplace";
import Campaigns from "@/pages/health/Campaigns";
import MedicalHistory from "@/pages/health/MedicalHistory";
import HistoryAnalyze from "@/pages/health/HistoryAnalyze";
import Alerts from "@/pages/health/Alerts";
import CommunityInsights from "@/pages/health/CommunityInsights";
import ConsultationCallManager from "@/components/features/ConsultationCallManager";
import ConfirmModal from "@/components/ui/ConfirmModal";

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      checkAuth();
    }
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex flex-col min-h-screen">
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#1f2937",
              borderRadius: "12px",
              border: "1px solid #f3f4f6",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            },
          }}
        />
        <ConsultationCallManager />
        <ConfirmModal />

        <Suspense fallback={<Loading fullScreen />}>
          <div className="flex-grow">
            <Routes>
              {/* Public Routes with Main Navbar */}
              <Route
                path="/"
                element={
                  <>
                    <Navbar />
                    <Landing />
                    <Footer />
                  </>
                }
              />
              <Route
                path="/auth"
                element={
                  <>
                    <Navbar />
                    <PublicRoute>
                      <Auth />
                    </PublicRoute>
                  </>
                }
              />

              {/* Flow Routes (Setup) */}
              <Route
                path="/profile-setup"
                element={
                  <FlowRoute>
                    <ProfileSetup />
                  </FlowRoute>
                }
              />

              {/* Dashboard / Sidebar Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Reports />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultation"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Consultation />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultants"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Consultants />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Booking />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-success"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <BookingSuccess />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-failed"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <BookingFailed />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <RoleRoute allowedRoles={["doctor"]}>
                    <DashboardLayout>
                      <MyAppointments />
                    </DashboardLayout>
                  </RoleRoute>
                }
              />
              <Route
                path="/doctors"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DoctorConsultation />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prevention"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <RiskAnalysis />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planner"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <HealthPlanner />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quest-game"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <QuestGame />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/family"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Family />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results/:id"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Results />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Profile />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prescriptions"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <PrescriptionScan />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/symptoms"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Symptoms />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Marketplace />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Campaigns />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medical-history"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MedicalHistory />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medical-history/analyze"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <HistoryAnalyze />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Alerts />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <CommunityInsights />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={["admin"]}>
                      <AdminLayout>
                        <AdminPanel />
                      </AdminLayout>
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/consultants"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={["admin"]}>
                      <AdminLayout>
                        <ConsultantsManagement />
                      </AdminLayout>
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor-profile"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={["doctor"]}>
                      <DoctorLayout>
                        <DoctorProfile />
                      </DoctorLayout>
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor-dashboard"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={["doctor"]}>
                      <DoctorLayout>
                        <DoctorDashboard />
                      </DoctorLayout>
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor-transactions"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={["doctor"]}>
                      <DoctorLayout>
                        <DoctorTransactions />
                      </DoctorLayout>
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor-appointments"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={["doctor"]}>
                      <DoctorLayout>
                        <DoctorAppointments />
                      </DoctorLayout>
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultation/live/:roomId"
                element={
                  <ProtectedRoute>
                    <ConsultationRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-appointments"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <UserAppointments />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultant-profile/:id"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ConsultantProfile />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultation-room/:roomId"
                element={
                  <ProtectedRoute>
                    <ConsultationRoom />
                  </ProtectedRoute>
                }
              />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </div>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
