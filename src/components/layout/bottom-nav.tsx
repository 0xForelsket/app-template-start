"use client";

import { PERMISSIONS, type Permission, hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { FolderKanban, Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  permissions: string[];
}

export function BottomNav({ permissions }: BottomNavProps) {
  const pathname = usePathname();

  const navItems: {
    label: string;
    href: string;
    icon: React.ReactNode;
    permission?: Permission;
  }[] = [
    {
      label: "Home",
      href: "/dashboard",
      icon: <Home className="h-6 w-6" />,
    },
    {
      label: "Projects",
      href: "/projects",
      icon: <FolderKanban className="h-6 w-6" />,
      permission: PERMISSIONS.PROJECT_VIEW,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="h-6 w-6" />,
    },
  ].filter(
    (item) => !item.permission || hasPermission(permissions, item.permission)
  );

  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = pathname === item.href;
    return (
      <li key={item.href} className="flex-1 h-full">
        <Link
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all h-full min-h-[64px] relative group",
            isActive
              ? "text-primary"
              : "text-muted-foreground active:text-foreground/70"
          )}
        >
          <div
            className={cn(
              "absolute inset-x-1 inset-y-1 rounded-xl transition-colors",
              isActive ? "bg-primary/10" : "group-active:bg-muted/50"
            )}
          />

          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all relative z-10",
              isActive
                ? "bg-primary/20 shadow-lg shadow-primary/20 text-primary"
                : ""
            )}
          >
            {item.icon}
          </div>
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider relative z-10",
              isActive && "text-primary"
            )}
          >
            {item.label}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden isolate print:hidden">
      <div className="bg-background/80 backdrop-blur-xl border-t border-border px-2 pb-[env(safe-area-inset-bottom)] transition-colors duration-300">
        <ul className="flex h-[72px] items-center justify-around">
          {navItems.map(renderNavItem)}
        </ul>
      </div>
    </nav>
  );
}
