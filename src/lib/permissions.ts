/**
 * Permission-based access control. Pattern: "resource:action"
 * Special permission "*" grants all permissions (superadmin).
 */

export const PERMISSIONS = {
  // User management
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Projects (example domain)
  PROJECT_VIEW: "project:view",
  PROJECT_CREATE: "project:create",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",

  // System administration
  SYSTEM_SETTINGS: "system:settings",

  // Superadmin - grants all permissions
  ALL: "*",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  employee: [PERMISSIONS.PROJECT_VIEW],

  supervisor: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.USER_VIEW,
  ],

  admin: [PERMISSIONS.ALL],
};

export const LEGACY_ROLES = ["employee", "supervisor", "admin"] as const;
export type LegacyRole = (typeof LEGACY_ROLES)[number];

export function getLegacyRolePermissions(role: LegacyRole): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: Permission
): boolean {
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}
