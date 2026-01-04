import {
  deleteSkillCategory,
  getSkillCategory,
  updateSkillCategory,
} from "@/actions/skill-categories";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { Trash2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { CategoryForm } from "../category-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({ params }: Props) {
  const { id } = await params;
  const category = await getSkillCategory(id);

  if (!category) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateSkillCategory(id, formData);
  }

  async function handleDelete() {
    "use server";
    const result = await deleteSkillCategory(id);
    if (result.success) {
      redirect("/skills/categories");
    }
    // If delete fails, we can't easily show error in form action
    // The user will need to use a different approach for error handling
  }

  return (
    <PageLayout
      title={category.name}
      headerActions={
        <form action={handleDelete}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </form>
      }
    >
      <CategoryForm
        mode="edit"
        initialData={category}
        onSubmit={handleUpdate}
      />
    </PageLayout>
  );
}
