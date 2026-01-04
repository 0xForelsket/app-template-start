import { getDepartments } from "@/actions/departments";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { Building2, Plus, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { DepartmentsTable } from "./departments-table";

export default async function AdminDepartmentsPage() {
  const departments = await getDepartments();
  const totalMembers = departments.reduce(
    (acc, dept) => acc + dept.memberCount,
    0
  );

  return (
    <PageLayout
      title="Department Directory"
      subtitle="Organization Management"
      description={`${departments.length} DEPARTMENTS • ${totalMembers} PERSONNEL`}
      bgSymbol="DT"
      headerActions={
        <Button
          asChild
          className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
        >
          <Link href="/admin/departments/new">
            <Plus className="mr-2 h-4 w-4" />
            ADD DEPARTMENT
          </Link>
        </Button>
      }
      stats={
        <StatsTicker
          stats={[
            {
              label: "Departments",
              value: departments.length,
              icon: Building2,
              variant: "default",
            },
            {
              label: "Total Personnel",
              value: totalMembers,
              icon: Users,
              variant: "primary",
            },
            {
              label: "Assigned Managers",
              value: departments.filter((d) => d.managerId).length,
              icon: ShieldCheck,
              variant: "success",
            },
          ]}
        />
      }
    >
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <DepartmentsTable departments={departments} />
      </div>
    </PageLayout>
  );
}
