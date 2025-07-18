import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout, { showNotification } from './components/Layout/Layout';
import AuthForm from './components/Auth/AuthForm';
import DonorDashboard from './components/Dashboard/DonorDashboard';
import SchoolDashboard from './components/Dashboard/SchoolDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import LandingPage from './components/Landing/LandingPage';
import { setNotificationFunction } from './services/api';
import apiService from './services/api';

const AppContent: React.FC = () => {
  const { user, login, register, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Connect the notification system to the API service
    setNotificationFunction(showNotification);
  }, []);

  // Effect to handle user state changes
  useEffect(() => {
    if (user) {
      // If user is logged in, ensure auth form is hidden
      setShowAuth(false);
      console.log('User authenticated, redirecting to dashboard');
      
      // Show welcome notification
      showNotification({
        type: 'success',
        message: `Welcome ${user.name}! You have been successfully logged in.`,
        duration: 4000
      });
    }
  }, [user]);

  const handleLogin = async (data: { email: string; password: string }) => {
    const success = await login(data.email, data.password);
    if (success) {
      // Check authentication status after login
      const authStatus = apiService.checkAuthStatus();
      console.log('Authentication status after login:', authStatus);
      
      if (!authStatus.isAuthenticated) {
        console.error('Login returned success but authentication check failed!');
        showNotification({
          type: 'error',
          message: 'Authentication error. Please try logging in again.',
          duration: 5000
        });
        return false;
      }
      
      setShowAuth(false); // Hide auth form on successful login
    }
    return success;
  };

  const handleRegister = async (data: { email: string; password: string; name: string; role: string }) => {
    const success = await register(data.email, data.password, data.name, data.role as any);
    if (success) {
      setShowAuth(false); // Hide auth form on successful registration
    }
    return success;
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