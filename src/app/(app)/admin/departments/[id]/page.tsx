import {
  deleteDepartment,
  getDepartmentWithDetails,
  updateDepartment,
} from "@/actions/departments";
import { getUsers } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DepartmentForm } from "../department-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DepartmentDetailPage({ params }: Props) {
  const { id } = await params;
  const [department, users] = await Promise.all([
    getDepartmentWithDetails(id),
    getUsers(),
  ]);

  if (!department) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateDepartment(id, formData);
    if (result.success) {
      return { success: true as const, data: { id } };
    }
    return result;
  }

  async function handleDelete() {
    "use server";
    const result = await deleteDepartment(id);
    if (result.success) {
      redirect("/admin/departments");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/departments"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {department.name}
            </h1>
            <p className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
              {department.code}
            </p>
          </div>
        </div>

        <form action={handleDelete}>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            className="font-bold"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            DELETE DEPARTMENT
          </Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Department Settings
            </h3>
            <DepartmentForm
              mode="edit"
              initialData={department}
              users={users.filter((u) => u.isActive)}
              onSubmit={handleUpdate}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Personnel ({department.memberCount})
            </h3>

            <div className="space-y-4">
              {department.members.length > 0 ? (
                department.members.map((member) => (
                  <Link
                    key={member.id}
                    href={`/admin/users/${member.id}`}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                          <Users className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                        {member.name}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 truncate">
                        {member.roleName || "No Role"} • {member.employeeId}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No members assigned.
                  </p>
                </div>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full mt-4 border-dashed border-2 hover:border-primary hover:bg-primary/5 text-[10px] font-black uppercase tracking-wider h-11"
              >
                <Link href="/admin/users/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Personnel
                </Link>
              </Button>
            </div>
          </div>

          {department.manager && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-6 text-white shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">
                Department Head
              </h3>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full border-2 border-primary bg-zinc-900 flex items-center justify-center text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-base">
                    {department.manager.name}
                  </p>
                  <p className="text-xs text-zinc-400 font-medium">
                    {department.manager.email || "No email"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
