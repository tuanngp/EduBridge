import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import AuthForm from './components/Auth/AuthForm';
import DonorDashboard from './components/Dashboard/DonorDashboard';
import SchoolDashboard from './components/Dashboard/SchoolDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import LandingPage from './components/Landing/LandingPage';

const AppContent: React.FC = () => {
  const { user, login, register, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAuth, setShowAuth] = useState(false);

  const handleLogin = async (data: { email: string; password: string }) => {
    return await login(data.email, data.password);
  };

  const handleRegister = async (data: { email: string; password: string; name: string; role: string }) => {
    return await register(data.email, data.password, data.name, data.role as any);
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  const handleGetStarted = () => {
    setShowAuth(true);
    setAuthMode('register');
  };

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

  if (!user && !showAuth) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (!user) {
    return (
      <AuthForm
        mode={authMode}
        onSubmit={authMode === 'login' ? handleLogin : handleRegister}
        onModeChange={toggleAuthMode}
        loading={loading}
      />
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'donor':
        return <DonorDashboard />;
      case 'school':
        return <SchoolDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to EduBridge</h2>
            <p className="text-gray-600">Your account role is not recognized. Please contact support.</p>
          </div>
        );
    }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;