import { deleteProject, getProject, updateProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { db } from "@/db";
import { Trash2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ProjectForm } from "../project-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const [users, departments] = await Promise.all([
    db.query.users.findMany({
      columns: { id: true, name: true },
      where: (users, { eq }) => eq(users.isActive, true),
    }),
    db.query.departments.findMany({
      columns: { id: true, name: true },
      where: (departments, { eq }) => eq(departments.isActive, true),
    }),
  ]);

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateProject(id, formData);
  }

  async function handleDelete() {
    "use server";
    await deleteProject(id);
    redirect("/projects");
  }

  return (
    <PageLayout
      title={project.name}
      headerActions={
        <form action={handleDelete}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </form>
      }
    >
      <ProjectForm
        mode="edit"
        initialData={project}
        users={users}
        departments={departments}
        onSubmit={handleUpdate}
      />
    </PageLayout>
  );
}
