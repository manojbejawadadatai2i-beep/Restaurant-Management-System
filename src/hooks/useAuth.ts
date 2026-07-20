import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ROLE_PERMISSIONS } from '../types';
import type { Permission, UserRole } from '../types';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { currentUser } = context;

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    const userRole = currentUser.role as UserRole;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role as UserRole);
  };

  return {
    ...context,
    hasPermission,
    hasRole,
    role: currentUser?.role as UserRole | undefined,
  };
};
