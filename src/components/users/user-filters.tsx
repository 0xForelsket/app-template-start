"use client";

import { FilterBar } from "@/components/ui/filter-bar";

interface UserFiltersProps {
  searchParams: {
    role?: string;
    search?: string;
  };
}

export function UserFilters({ searchParams }: UserFiltersProps) {
  return (
    <FilterBar
      basePath="/admin/users"
      searchParams={searchParams}
      searchPlaceholder="FILTER BY NAME OR ID..."
      enableRealtimeSearch={true}
      filters={[
        {
          name: "role",
          options: [
            { value: "all", label: "ANY ROLE" },
            { value: "employee", label: "EMPLOYEE" },
            { value: "supervisor", label: "SUPERVISOR" },
            { value: "admin", label: "ADMIN" },
          ],
        },
      ]}
    />
  );
}
