export type UserRole = 
  | 'Corporate Administrator'
  | 'Administrator'
  | 'Store Manager'
  | 'District Manager'
  | 'Regional Manager';

export type Permission = 
  | 'view:user-management'
  | 'view:system-health'
  | 'view:scope-filters';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Corporate Administrator': ['view:user-management', 'view:scope-filters'],
  'Administrator': ['view:user-management', 'view:system-health', 'view:scope-filters'],
  'Regional Manager': [],
  'District Manager': [],
  'Store Manager': [],
};
