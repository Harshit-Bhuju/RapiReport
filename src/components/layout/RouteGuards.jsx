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
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

export const FlowRoute = ({ children }) => {
  const { isAuthenticated, isProfileComplete } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (isProfileComplete) return <Navigate to="/dashboard" replace />;
  return children;
};
