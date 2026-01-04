import { getDepartments } from "@/actions/departments";
import { getAllRoles, getUserById, updateUser } from "@/actions/users";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteUserButton } from "../delete-user-button";
import { UserForm } from "../user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;

  const [user, roles, departments] = await Promise.all([
    getUserById(userId),
    getAllRoles(),
    getDepartments(),
  ]);

  if (!user) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateUser(userId, formData);
    if (result.success) {
      return { success: true as const };
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground font-mono">{user.employeeId}</p>
          </div>
        </div>
        <DeleteUserButton userId={user.id} userName={user.name} />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <UserForm
          mode="edit"
          roles={roles}
          departments={departments}
          initialData={{
            id: user.id,
            employeeId: user.employeeId,
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            departmentId: user.departmentId,
            isActive: user.isActive,
          }}
          onSubmit={handleUpdate}
        />
      </div>
    </div>
  );
}
