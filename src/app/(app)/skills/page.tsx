import { getSkillCategories } from "@/actions/skill-categories";
import { getSkills, getSkillStats } from "@/actions/skills";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { Award, BookOpen, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";
import { SkillFilters } from "./skill-filters";
import { SkillsTable } from "./skills-table";

interface Props {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    isActive?: string;
    requiresCertification?: string;
  }>;
}

export default async function SkillsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [skills, categories, stats] = await Promise.all([
    getSkills(params),
    getSkillCategories({ isActive: "true" }),
    getSkillStats(),
  ]);

  return (
    <PageLayout
      title="Skill Catalog"
      headerActions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/skills/categories">Manage Categories</Link>
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
              label: "Total Skills",
              value: stats.total,
              icon: BookOpen,
              variant: "default",
            },
            {
              label: "Active",
              value: stats.active,
              icon: CheckCircle,
              variant: "success",
            },
            {
              label: "Require Certification",
              value: stats.requiresCertification,
              icon: Award,
              variant: "primary",
            },
          ]}
        />
      }
      filters={<SkillFilters categories={categories} searchParams={params} />}
    >
      <SkillsTable skills={skills} />
    </PageLayout>
  );
}
