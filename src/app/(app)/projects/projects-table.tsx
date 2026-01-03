"use client";

import { Badge } from "@/components/ui/badge";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import type { Project } from "@/db/schema";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectWithRelations extends Project {
  owner?: { name: string } | null;
  department?: { name: string } | null;
}

interface Props {
  projects: ProjectWithRelations[];
}

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  active: "default",
  on_hold: "outline",
  completed: "default",
  cancelled: "destructive",
};

export function ProjectsTable({ projects }: Props) {
  const router = useRouter();

  const columns: ColumnDef<ProjectWithRelations>[] = [
    {
      id: "name",
      header: "Name",
      cell: (project) => <span className="font-medium">{project.name}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (project) => (
        <Badge variant={statusColors[project.status] || "default"}>
          {project.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      id: "owner",
      header: "Owner",
      cell: (project) => (
        <span className="text-muted-foreground">
          {project.owner?.name || "-"}
        </span>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: (project) => (
        <span className="text-muted-foreground">
          {project.department?.name || "-"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (project) => (
        <span className="text-muted-foreground">
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={projects}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(project) => router.push(`/projects/${project.id}`)}
      emptyMessage="No projects yet"
      emptyIcon={Plus}
    />
  );
}
