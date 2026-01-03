import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { FolderKanban, Home, Settings2, Shield, Users } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: Permission;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <Home className="h-5 w-5" />,
        permission: PERMISSIONS.PROJECT_VIEW,
      },
    ],
  },
  {
    label: "Main",
    items: [
      {
        label: "Projects",
        href: "/projects",
        icon: <FolderKanban className="h-5 w-5" />,
        permission: PERMISSIONS.PROJECT_VIEW,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: <Users className="h-5 w-5" />,
        permission: PERMISSIONS.USER_VIEW,
      },
      {
        label: "Roles",
        href: "/admin/roles",
        icon: <Shield className="h-5 w-5" />,
        permission: PERMISSIONS.USER_VIEW,
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: <Settings2 className="h-5 w-5" />,
        permission: PERMISSIONS.SYSTEM_SETTINGS,
      },
    ],
  },
];
