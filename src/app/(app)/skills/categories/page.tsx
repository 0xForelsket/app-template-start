import {
  getSkillCategories,
  getSkillCategoryStats,
} from "@/actions/skill-categories";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { CheckCircle, Folder, Plus } from "lucide-react";
import Link from "next/link";
import { CategoriesTable } from "./categories-table";

export default async function SkillCategoriesPage() {
  const [categories, stats] = await Promise.all([
    getSkillCategories(),
    getSkillCategoryStats(),
  ]);

  return (
    <PageLayout
      title="Skill Categories"
      headerActions={
        <Button asChild size="sm">
          <Link href="/skills/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Link>
        </Button>
      }
      stats={
        <StatsTicker
          stats={[
            {
              label: "Total Categories",
              value: stats.total,
              icon: Folder,
              variant: "default",
            },
            {
              label: "Active",
              value: stats.active,
              icon: CheckCircle,
              variant: "success",
            },
          ]}
        />
      }
    >
      <CategoriesTable categories={categories} />
    </PageLayout>
  );
}
