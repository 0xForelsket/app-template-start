"use client";

import { FilterBar, type FilterConfig } from "@/components/ui/filter-bar";
import type { SkillCategory } from "@/db/schema";

interface Props {
  categories: SkillCategory[];
  searchParams: {
    search?: string;
    categoryId?: string;
    isActive?: string;
    requiresCertification?: string;
  };
}

export function SkillFilters({ categories, searchParams }: Props) {
  const filters: FilterConfig[] = [
    {
      name: "categoryId",
      options: [
        { value: "all", label: "All Categories" },
        ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
      ],
      minWidth: "160px",
    },
    {
      name: "isActive",
      options: [
        { value: "all", label: "All Status" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
      minWidth: "120px",
    },
    {
      name: "requiresCertification",
      options: [
        { value: "all", label: "All Types" },
        { value: "true", label: "Requires Cert" },
        { value: "false", label: "No Cert" },
      ],
      minWidth: "140px",
    },
  ];

  return (
    <FilterBar
      basePath="/skills"
      searchParams={searchParams}
      searchPlaceholder="Search skills..."
      filters={filters}
      enableRealtimeSearch
    />
  );
}
