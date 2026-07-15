import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRBAC } from '../hooks/useRBAC';
import type { Permission } from '../utils/permissions';

interface RoleRouteProps {
  children: React.ReactNode;
  permission?: Permission;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ children, permission }) => {
  const { hasPermission } = useRBAC();

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
