import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout/Layout";
import LandingPage from "./components/Landing/LandingPage";
import AuthForm from "./components/Auth/AuthForm";
import DonorDashboard from "./components/Dashboard/DonorDashboard";
import SchoolDashboard from "./components/Dashboard/SchoolDashboard";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import DeviceSuggestionTest from "./components/common/DeviceSuggestionTest";
import VerifyVoucher from "./components/VerifyVoucher";
import DeviceSuggestionPreview from "./components/common/DeviceSuggestionPreview";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, login, register, loading } = useAuth();

  const handleLogin = async (data: { email: string; password: string }) => {
    return await login(data.email, data.password);
  };

  const handleRegister = async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }) => {
    return await register(
      data.email,
      data.password,
      data.name,
      data.role as any
    );
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            !user ? (
              <LandingPage onGetStarted={() => {}} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            !user ? (
              <AuthForm
                mode="login"
                onSubmit={handleLogin}
                onModeChange={() => {}}
                loading={loading}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !user ? (
              <AuthForm
                mode="register"
                onSubmit={handleRegister}
                onModeChange={() => {}}
                loading={loading}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/verify-voucher/:code"
          element={
            <Layout>
              <VerifyVoucher />
            </Layout>
          }
        />

        {/* Test routes */}
        <Route
          path="/test/device-suggestion"
          element={
            <Layout>
              <DeviceSuggestionTest />
            </Layout>
          }
        />
        <Route
          path="/test/device-suggestion-preview"
          element={
            <Layout>
              <DeviceSuggestionPreview />
            </Layout>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                {user?.role === "donor" && <DonorDashboard />}
                {user?.role === "school" && <SchoolDashboard />}
                {user?.role === "admin" && <AdminDashboard />}
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
