import { getSkillCategories } from "@/actions/skill-categories";
import { deleteSkill, getSkill, updateSkill } from "@/actions/skills";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { Trash2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { SkillForm } from "../skill-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SkillDetailPage({ params }: Props) {
  const { id } = await params;
  const [skill, categories] = await Promise.all([
    getSkill(id),
    getSkillCategories({ isActive: "true" }),
  ]);

  if (!skill) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateSkill(id, formData);
  }

  async function handleDelete() {
    "use server";
    await deleteSkill(id);
    redirect("/skills");
  }

  return (
    <PageLayout
      title={skill.name}
      headerActions={
        <form action={handleDelete}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </form>
      }
    >
      <SkillForm
        mode="edit"
        initialData={skill}
        categories={categories}
        onSubmit={handleUpdate}
      />
    </PageLayout>
  );
}
