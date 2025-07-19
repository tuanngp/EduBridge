import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { setNotificationFunction } from './services/api';
import { showNotification } from './components/Layout/Layout';
import AppRoutes from './routes';

function App() {
  useEffect(() => {
    // Connect the notification system to the API service
    setNotificationFunction(showNotification);
  }, []);

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;