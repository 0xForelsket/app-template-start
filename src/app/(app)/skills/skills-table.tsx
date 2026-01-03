"use client";

import { Badge } from "@/components/ui/badge";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import type { Skill, SkillCategory } from "@/db/schema";
import { BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface SkillWithRelations extends Skill {
  category?: SkillCategory | null;
}

interface Props {
  skills: SkillWithRelations[];
}

export function SkillsTable({ skills }: Props) {
  const router = useRouter();

  const columns: ColumnDef<SkillWithRelations>[] = [
    {
      id: "code",
      header: "Code",
      cell: (skill) => (
        <span className="font-mono text-sm font-medium">{skill.code}</span>
      ),
      width: "100px",
    },
    {
      id: "name",
      header: "Name",
      cell: (skill) => <span className="font-medium">{skill.name}</span>,
    },
    {
      id: "category",
      header: "Category",
      cell: (skill) =>
        skill.category ? (
          <Badge
            variant="outline"
            style={{ borderColor: skill.category.color || undefined }}
          >
            {skill.category.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: "certification",
      header: "Certification",
      cell: (skill) =>
        skill.requiresCertification ? (
          <Badge variant="secondary">
            {skill.certificationValidityMonths
              ? `${skill.certificationValidityMonths} mo`
              : "Required"}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: "trainingHours",
      header: "Training Hrs",
      cell: (skill) => (
        <span className="text-muted-foreground">
          {skill.requiredTrainingHours ?? "-"}
        </span>
      ),
      align: "right",
    },
    {
      id: "status",
      header: "Status",
      cell: (skill) => (
        <Badge variant={skill.isActive ? "default" : "secondary"}>
          {skill.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      data={skills}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(skill) => router.push(`/skills/${skill.id}`)}
      emptyMessage="No skills found"
      emptyIcon={BookOpen}
    />
  );
}
