export type UserRole = 
  | 'Corporate Administrator'
  | 'Administrator'
  | 'Store Manager'
  | 'District Manager'
  | 'Regional Manager';

export type Permission = 
  | 'view:user-management'
  | 'view:system-health'
  | 'view:scope-filters'
  | 'view:dashboard'
  | 'view:reports';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Corporate Administrator': ['view:scope-filters', 'view:dashboard', 'view:reports'],
  'Administrator': ['view:user-management', 'view:scope-filters'],
  'Regional Manager': ['view:dashboard', 'view:reports'],
  'District Manager': ['view:dashboard', 'view:reports'],
  'Store Manager': ['view:dashboard', 'view:reports'],
};
