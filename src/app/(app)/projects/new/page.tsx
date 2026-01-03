import { createProject } from "@/actions/projects";
import { PageLayout } from "@/components/ui/page-layout";
import { db } from "@/db";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
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

  return (
    <PageLayout title="New Project">
      <ProjectForm
        mode="create"
        users={users}
        departments={departments}
        onSubmit={createProject}
      />
    </PageLayout>
  );
}
