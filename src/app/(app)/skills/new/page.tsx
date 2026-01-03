import { getSkillCategories } from "@/actions/skill-categories";
import { createSkill } from "@/actions/skills";
import { PageLayout } from "@/components/ui/page-layout";
import { SkillForm } from "../skill-form";

export default async function NewSkillPage() {
  const categories = await getSkillCategories({ isActive: "true" });

  return (
    <PageLayout title="New Skill">
      <SkillForm mode="create" categories={categories} onSubmit={createSkill} />
    </PageLayout>
  );
}
