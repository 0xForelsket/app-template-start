import { getDepartments, getSkillCategoryStats } from "@/actions/skill-categories";
import { getSkillStats } from "@/actions/skills";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import {
  Award,
  BookOpen,
  Building2,
  FolderKanban,
  Layers,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { SkillHierarchyClient } from "./skill-hierarchy-client";

export default async function SkillsPage() {
  const [departments, categoryStats, skillStats] = await Promise.all([
    getDepartments(),
    getSkillCategoryStats(),
    getSkillStats(),
  ]);

  return (
    <PageLayout
      title="Skill Catalog"
      description="Browse and manage skills by department and project"
      headerActions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/skills/categories">
              <FolderKanban className="h-4 w-4 mr-2" />
              Manage Categories
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/skills/new">
              <Plus className="h-4 w-4 mr-2" />
              New Skill
            </Link>
          </Button>
        </div>
      }
      stats={
        <StatsTicker
          stats={[
            {
              label: "Departments",
              value: categoryStats.departments,
              icon: Building2,
              variant: "default",
            },
            {
              label: "Projects",
              value: categoryStats.projects,
              icon: FolderKanban,
              variant: "primary",
            },
            {
              label: "Total Skills",
              value: skillStats.total,
              icon: BookOpen,
              variant: "success",
            },
            {
              label: "Sub-Skills",
              value: skillStats.subSkills,
              icon: Layers,
              variant: "default",
            },
            {
              label: "Require Certification",
              value: skillStats.requiresCertification,
              icon: Award,
              variant: "warning",
            },
          ]}
        />
      }
    >
      <SkillHierarchyClient departments={departments} />
    </PageLayout>
  );
}
