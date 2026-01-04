import {
  getAreas,
  getCategoryBreadcrumbs,
  getSkillCategoryBySlug,
} from "@/actions/skill-categories";
import { getSkillsByCategory } from "@/actions/skills";
import { DepartmentContentView } from "@/app/(app)/skills/department-content-view";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ department: string }>;
}

export default async function DepartmentPage({ params }: Props) {
  const { department: deptSlug } = await params;

  const department = await getSkillCategoryBySlug(deptSlug);
  if (!department || department.type !== "department") {
    notFound();
  }

  // Fetch areas, skills directly in department, and breadcrumbs
  const [areas, departmentSkills, breadcrumbData] = await Promise.all([
    getAreas(department.id),
    getSkillsByCategory(department.id, true), // Skills directly assigned to department
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
      description={
        department.description || `Skills and areas in ${department.name}`
      }
      headerActions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/skills">
              <ChevronLeft className="h-4 w-4 mr-2" />
              All Departments
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/skills/new?categoryId=${department.id}`}>
              <Plus className="h-4 w-4 mr-2" />
              New Skill
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              href={`/skills/categories/new?parentId=${department.id}&type=area`}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Area
            </Link>
          </Button>
        </div>
      }
    >
      <DepartmentContentView
        breadcrumbs={breadcrumbs}
        areas={areas}
        skills={departmentSkills}
        department={department}
      />
    </PageLayout>
  );
}
