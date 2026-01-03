import { getSkillCategories } from "@/actions/skill-categories";
import { createSkill, getSkills } from "@/actions/skills";
import { PageLayout } from "@/components/ui/page-layout";
import { SkillForm } from "../skill-form";

export default async function NewSkillPage() {
  const [categories, rootSkills] = await Promise.all([
    getSkillCategories({ isActive: "true" }),
    getSkills({ isActive: "true", rootOnly: "true" }),
  ]);

  // Filter to only skills without children (leaf skills can't be parents in most cases)
  // Actually, we allow any root skill to be a parent
  const parentSkills = rootSkills.filter((s) => !s.parentSkillId);

  return (
    <PageLayout title="New Skill">
      <SkillForm
        mode="create"
        categories={categories}
        parentSkills={parentSkills}
        onSubmit={createSkill}
      />
    </PageLayout>
  );
}
