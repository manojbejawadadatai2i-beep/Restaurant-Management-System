import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { routeConfig } from './routeConfig';

import { DashboardLayout } from '../pages/dashboard/DashboardLayout';
import { Reports } from '../pages/reports/Reports';
import { UserManagement } from '../pages/settings/UserManagement';
import { SiteHealth } from '../pages/settings/SiteHealth';
import { Unauthorized } from '../pages/unauthorized/Unauthorized';
import { NotFound } from '../pages/not-found/NotFound';

import { useRBAC } from '../hooks/useRBAC';

const RootRedirect: React.FC = () => {
  const { hasPermission } = useRBAC();
  if (hasPermission('view:dashboard')) {
    return <Navigate to="/dashboard" replace />;
  }
  if (hasPermission('view:user-management')) {
    return <Navigate to="/users" replace />;
  }
  return <Navigate to="/unauthorized" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirects dynamically based on permissions */}
      <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

      {/* Protected Routes */}
      <Route
        path={routeConfig.dashboard.path}
        element={
          <ProtectedRoute>
            <RoleRoute permission={routeConfig.dashboard.permission}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routeConfig.reports.path}
        element={
          <ProtectedRoute>
            <RoleRoute permission={routeConfig.reports.permission}>
              <Reports />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routeConfig.users.path}
        element={
          <ProtectedRoute>
            <RoleRoute permission={routeConfig.users.permission}>
              <UserManagement />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routeConfig.health.path}
        element={
          <ProtectedRoute>
            <RoleRoute permission={routeConfig.health.permission}>
              <SiteHealth />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route path={routeConfig.unauthorized.path} element={<Unauthorized />} />

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
