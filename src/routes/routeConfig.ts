import type { Permission } from '../utils/permissions';

export interface RouteItem {
  path: string;
  permission?: Permission;
}

export const routeConfig: Record<string, RouteItem> = {
  dashboard: {
    path: '/dashboard',
    permission: 'view:dashboard',
  },
  reports: {
    path: '/reports',
    permission: 'view:reports',
  },
  users: {
    path: '/users',
    permission: 'view:user-management',
  },
  health: {
    path: '/health',
    permission: 'view:system-health',
  },
  unauthorized: {
    path: '/unauthorized',
  },
};
