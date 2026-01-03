import { getProjectStats, getProjects } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { CheckCircle, FileEdit, FolderKanban, Play, Plus } from "lucide-react";
import Link from "next/link";
import { ProjectsTable } from "./projects-table";

interface Props {
  searchParams: Promise<{
    search?: string;
    status?: string;
    ownerId?: string;
    departmentId?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [projects, stats] = await Promise.all([
    getProjects(params),
    getProjectStats(),
  ]);

  return (
    <PageLayout
      title="Projects"
      headerActions={
        <Button asChild size="sm">
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      }
      stats={
        <StatsTicker
          stats={[
            {
              label: "Total Projects",
              value: stats.total,
              icon: FolderKanban,
              variant: "default",
            },
            {
              label: "Draft",
              value: stats.draft,
              icon: FileEdit,
              variant: "default",
            },
            {
              label: "Active",
              value: stats.active,
              icon: Play,
              variant: "primary",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle,
              variant: "success",
            },
          ]}
        />
      }
    >
      <ProjectsTable projects={projects} />
    </PageLayout>
  );
}
