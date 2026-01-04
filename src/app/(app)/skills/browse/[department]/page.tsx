import {
  getCategoryBreadcrumbs,
  getProjects,
  getSkillCategoryBySlug,
} from "@/actions/skill-categories";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillCardsView } from "../../skill-cards-view";

interface Props {
  params: Promise<{ department: string }>;
}

export default async function DepartmentPage({ params }: Props) {
  const { department: deptSlug } = await params;

  const department = await getSkillCategoryBySlug(deptSlug);
  if (!department || department.type !== "department") {
    notFound();
  }

  const [projects, breadcrumbData] = await Promise.all([
    getProjects(department.id),
    getCategoryBreadcrumbs(department.id),
  ]);

  const breadcrumbs = [
    { label: "Skills", href: "/skills" },
    ...breadcrumbData.map((b) => ({
      label: b.name,
      href: `/skills/browse/${b.slug}`,
    })),
  ];

  return (
    <PageLayout
      title={department.name}
      description={department.description || `Projects in ${department.name}`}
      headerActions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/skills">
              <ChevronLeft className="h-4 w-4 mr-2" />
              All Departments
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link
              href={`/skills/categories/new?parentId=${department.id}&type=project`}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      }
    >
      <SkillCardsView
        breadcrumbs={breadcrumbs}
        projects={projects}
        currentLevel="projects"
        currentCategory={department}
      />
    </PageLayout>
  );
}
