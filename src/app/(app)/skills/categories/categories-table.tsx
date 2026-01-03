"use client";

import { Badge } from "@/components/ui/badge";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import type { SkillCategory } from "@/db/schema";
import { Folder } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  categories: SkillCategory[];
}

export function CategoriesTable({ categories }: Props) {
  const router = useRouter();

  const columns: ColumnDef<SkillCategory>[] = [
    {
      id: "color",
      header: "",
      cell: (category) => (
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: category.color || "#94a3b8" }}
        />
      ),
      width: "40px",
    },
    {
      id: "name",
      header: "Name",
      cell: (category) => <span className="font-medium">{category.name}</span>,
    },
    {
      id: "description",
      header: "Description",
      cell: (category) => (
        <span className="text-muted-foreground line-clamp-1">
          {category.description || "-"}
        </span>
      ),
    },
    {
      id: "sortOrder",
      header: "Order",
      cell: (category) => (
        <span className="text-muted-foreground">{category.sortOrder}</span>
      ),
      align: "center",
      width: "80px",
    },
    {
      id: "status",
      header: "Status",
      cell: (category) => (
        <Badge variant={category.isActive ? "default" : "secondary"}>
          {category.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      data={categories}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(category) => router.push(`/skills/categories/${category.id}`)}
      emptyMessage="No categories found"
      emptyIcon={Folder}
    />
  );
}
