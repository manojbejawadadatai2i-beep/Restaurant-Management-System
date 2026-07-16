import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRBAC } from '../hooks/useRBAC';
import type { Permission } from '../utils/permissions';

interface RoleRouteProps {
  children: React.ReactNode;
  permission?: Permission;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ children, permission }) => {
  const { hasPermission } = useRBAC();
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
