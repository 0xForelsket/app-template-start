import { getSkillCategoryBySlug } from "@/actions/skill-categories";
import { getSkillByCode, getSubSkills } from "@/actions/skills";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { db } from "@/db";
import { skillCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillCardsView } from "../../../../skill-cards-view";

interface Props {
  params: Promise<{ department: string; area: string; skill: string }>;
}

export default async function SkillSubskillsPage({ params }: Props) {
  const {
    department: deptSlug,
    area: areaSlug,
    skill: skillCode,
  } = await params;

  // Verify the hierarchy
  const department = await getSkillCategoryBySlug(deptSlug);
  if (!department || department.type !== "department") {
    notFound();
  }

  const area = await db.query.skillCategories.findFirst({
    where: eq(skillCategories.slug, areaSlug),
    with: { parent: true },
  });

  if (!area || area.type !== "area" || area.parentId !== department.id) {
    notFound();
  }

  // Get the skill by code
  const skill = await getSkillByCode(skillCode);
  if (!skill || skill.categoryId !== area.id) {
    notFound();
  }

  const subSkills = await getSubSkills(skill.id);

  const breadcrumbs = [
    { label: "Skills", href: "/skills" },
    { label: department.name, href: `/skills/browse/${department.slug}` },
    {
      label: area.name,
      href: `/skills/browse/${department.slug}/${area.slug}`,
    },
    { label: skill.name },
  ];

  return (
    <PageLayout
      title={skill.name}
      description={skill.description || `Sub-skills of ${skill.name}`}
      headerActions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/skills/browse/${department.slug}/${area.slug}`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to {area.name}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/skills/${skill.id}`}>View Skill Details</Link>
          </Button>
          <Button asChild size="sm">
            <Link
              href={`/skills/new?categoryId=${area.id}&parentSkillId=${skill.id}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Sub-Skill
            </Link>
          </Button>
        </div>
      }
    >
      <SkillCardsView
        breadcrumbs={breadcrumbs}
        skills={subSkills}
        currentLevel="subskills"
        currentSkill={skill}
      />
    </PageLayout>
  );
}
