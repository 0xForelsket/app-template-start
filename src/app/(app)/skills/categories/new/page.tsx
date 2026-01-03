import { createSkillCategory } from "@/actions/skill-categories";
import { PageLayout } from "@/components/ui/page-layout";
import { CategoryForm } from "../category-form";

export default function NewCategoryPage() {
  return (
    <PageLayout title="New Category">
      <CategoryForm mode="create" onSubmit={createSkillCategory} />
    </PageLayout>
  );
}
