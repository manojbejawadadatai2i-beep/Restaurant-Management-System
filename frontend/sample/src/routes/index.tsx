import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Permission } from '../types';

// Page Imports
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Reports } from '../pages/reports/Reports';
import { UserManagement } from '../pages/admin/UserManagement';
import { Settings } from '../pages/settings/Settings';
import { Unauthorized } from '../pages/unauthorized/Unauthorized';
import { NotFound } from '../pages/not-found/NotFound';
import { StoresList } from '../pages/stores/StoresList';

// 1. Root redirect dynamic routing based on permissions
const RootRedirect: React.FC = () => {
  const { hasPermission } = useAuth();
  if (hasPermission('view:dashboard')) {
    return <Navigate to="/dashboard" replace />;
  }
  if (hasPermission('view:user-management')) {
    return <Navigate to="/users" replace />;
  }
  return <Navigate to="/unauthorized" replace />;
};

// 2. Protected Route wrapper (ensures user session exists)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Validating Session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// 3. Role/Permission Protected Route wrapper
const RoleRoute: React.FC<{ children: React.ReactNode; permission?: Permission }> = ({ children, permission }) => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const isAuthorized = !permission || hasPermission(permission);

  useEffect(() => {
    if (!isAuthorized) {
      navigate('/unauthorized', { replace: true });
    }
  }, [isAuthorized, navigate]);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

// 4. Main consolidated Routes exporter
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirects dynamically based on permissions */}
      <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

      {/* Protected Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute permission="view:dashboard">
              <Dashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stores"
        element={
          <ProtectedRoute>
            <RoleRoute permission="view:dashboard">
              <StoresList />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <RoleRoute permission="view:reports">
              <Reports />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <RoleRoute permission="view:user-management">
              <UserManagement />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default AppRoutes;