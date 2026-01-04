"use client";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import { Building2, ChevronRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  managerId: string | null;
  managerName: string | null;
  memberCount: number;
}

interface Props {
  departments: Department[];
}

export function DepartmentsTable({ departments }: Props) {
  const router = useRouter();

  const columns: ColumnDef<Department>[] = [
    {
      id: "info",
      header: "Department",
      cell: (dept) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">{dept.name}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-0.5">
              {dept.code}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "manager",
      header: "Manager",
      cell: (dept) => (
        <div className="text-sm">
          {dept.managerName ? (
            <span className="font-medium text-foreground">
              {dept.managerName}
            </span>
          ) : (
            <span className="text-muted-foreground italic">
              No manager assigned
            </span>
          )}
        </div>
      ),
    },
    {
      id: "members",
      header: "Members",
      cell: (dept) => (
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="h-4 w-4 text-muted-foreground" />
          {dept.memberCount}
        </div>
      ),
      align: "center",
      width: "100px",
    },
    {
      id: "actions",
      header: "",
      cell: () => (
        <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors ml-auto" />
      ),
      width: "40px",
    },
  ];

  return (
    <DataTable
      data={departments}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(dept) => router.push(`/admin/departments/${dept.id}`)}
      emptyMessage="No departments found"
      emptyIcon={Building2}
    />
  );
}
