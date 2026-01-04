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
  params: Promise<{ department: string; project: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { department: deptSlug, project: projSlug } = await params;

  // First get the department to find the project
  const department = await getSkillCategoryBySlug(deptSlug);
  if (!department || department.type !== "department") {
    notFound();
  }

  // Find the project by slug within this department
  const project = await db.query.skillCategories.findFirst({
    where: eq(skillCategories.slug, projSlug),
    with: {
      parent: true,
    },
  });

  if (
    !project ||
    project.type !== "project" ||
    project.parentId !== department.id
  ) {
    notFound();
  }

  const [skills, breadcrumbData] = await Promise.all([
    getSkillsByCategory(project.id, true),
    getCategoryBreadcrumbs(project.id),
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
      title={project.name}
      description={project.description || `Skills in ${project.name}`}
      headerActions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/skills/browse/${department.slug}`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to {department.name}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/skills/new?categoryId=${project.id}`}>
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
          ...project,
          parent: department,
        }}
      />
    </PageLayout>
  );
}
