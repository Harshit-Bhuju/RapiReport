import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export const ProtectedRoute = ({ children, requireProfile = true }) => {
  const { isAuthenticated, isProfileComplete } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  if (requireProfile && !isProfileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const FlowRoute = ({ children }) => {
  const { isAuthenticated, isProfileComplete, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (isProfileComplete) {
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  if (!allowedRoles.includes(user?.role)) {
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
