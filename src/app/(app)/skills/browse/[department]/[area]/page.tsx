import {
  getCategoryBreadcrumbs,
  getSkillCategoryBySlug,
} from "@/actions/skill-categories";
import { getSkillsByCategory } from "@/actions/skills";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { db } from "@/db";
import { skillCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillCardsView } from "../../../skill-cards-view";

interface Props {
  params: Promise<{ department: string; area: string }>;
}

export default async function AreaPage({ params }: Props) {
  const { department: deptSlug, area: areaSlug } = await params;

  // First get the department to find the area
  const department = await getSkillCategoryBySlug(deptSlug);
  if (!department || department.type !== "department") {
    notFound();
  }

  // Find the area by slug within this department
  const area = await db.query.skillCategories.findFirst({
    where: eq(skillCategories.slug, areaSlug),
    with: {
      parent: true,
    },
  });

  if (!area || area.type !== "area" || area.parentId !== department.id) {
    notFound();
  }

  const [skills, breadcrumbData] = await Promise.all([
    getSkillsByCategory(area.id, true),
    getCategoryBreadcrumbs(area.id),
  ]);

  const breadcrumbs = [
    { label: "Skills", href: "/skills" },
    ...breadcrumbData.map((b) => ({
      label: b.name,
      href:
        b.type === "department"
          ? `/skills/browse/${b.slug}`
          : `/skills/browse/${department.slug}/${b.slug}`,
    })),
  ];

  return (
    <PageLayout
      title={area.name}
      description={area.description || `Skills in ${area.name}`}
      headerActions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/skills/browse/${department.slug}`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to {department.name}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/skills/new?categoryId=${area.id}`}>
              <Plus className="h-4 w-4 mr-2" />
              New Skill
            </Link>
          </Button>
        </div>
      }
    >
      <SkillCardsView
        breadcrumbs={breadcrumbs}
        skills={skills}
        currentLevel="skills"
        currentCategory={{
          ...area,
          parent: department,
        }}
      />
    </PageLayout>
  );
}
