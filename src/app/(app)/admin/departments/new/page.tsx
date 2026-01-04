import { createDepartment } from "@/actions/departments";
import { getUsers } from "@/actions/users";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DepartmentForm } from "../department-form";

export default async function NewDepartmentPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/departments"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create New Department
          </h1>
          <p className="text-muted-foreground">
            Define a new organizational unit
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <DepartmentForm
          mode="create"
          users={users.filter((u) => u.isActive)}
          onSubmit={createDepartment}
        />
      </div>
    </div>
  );
}
