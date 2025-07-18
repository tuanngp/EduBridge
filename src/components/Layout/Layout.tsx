import React, { useState, useEffect } from 'react';
import Header from './Header';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface Notification {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
  duration?: number;
}

// Global notification system
let notificationHandler: ((notification: Omit<Notification, 'id'>) => void) | null = null;

export const showNotification = (notification: Omit<Notification, 'id'>) => {
  if (notificationHandler) {
    notificationHandler(notification);
  }
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Set up global notification handler
    notificationHandler = (notification) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = { ...notification, id };
      
      setNotifications(prev => [...prev, newNotification]);
      
      // Auto remove after duration (default 5 seconds)
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    };

    return () => {
      notificationHandler = null;
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'success': return 'bg-green-50 border-green-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-800';
      case 'success': return 'text-green-800';
      case 'info': return 'text-blue-800';
      default: return 'text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start p-4 border rounded-lg shadow-lg max-w-sm animate-slide-in-right ${getBackgroundColor(notification.type)}`}
          >
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${getTextColor(notification.type)}`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;