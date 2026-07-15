import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS } from '../utils/permissions';
import type { Permission, UserRole } from '../utils/permissions';

export const useRBAC = () => {
  const { currentUser } = useAuth();
  
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
    currentUser,
    hasPermission,
    hasRole,
    role: currentUser?.role as UserRole | undefined,
  };
};
