import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-405 dark:text-slate-500 uppercase tracking-widest">Validating Session...</p>
      </div>
    );
  }

  if (!currentUser) {
    // Falls back to dashboard if no user is initialized
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
