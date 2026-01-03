import { getSkillCategoryBySlug } from "@/actions/skill-categories";
import { getSkillByCode, getSubSkills, getSkillBreadcrumbs } from "@/actions/skills";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillCardsView } from "../../../../skill-cards-view";
import { db } from "@/db";
import { skillCategories } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Props {
    params: Promise<{ department: string; project: string; skill: string }>;
}

export default async function SkillSubskillsPage({ params }: Props) {
    const { department: deptSlug, project: projSlug, skill: skillCode } = await params;

    // Verify the hierarchy
    const department = await getSkillCategoryBySlug(deptSlug);
    if (!department || department.type !== "department") {
        notFound();
    }

    const project = await db.query.skillCategories.findFirst({
        where: eq(skillCategories.slug, projSlug),
        with: { parent: true },
    });

    if (!project || project.type !== "project" || project.parentId !== department.id) {
        notFound();
    }

    // Get the skill by code
    const skill = await getSkillByCode(skillCode);
    if (!skill || skill.categoryId !== project.id) {
        notFound();
    }

    const [subSkills, breadcrumbData] = await Promise.all([
        getSubSkills(skill.id),
        getSkillBreadcrumbs(skill.id),
    ]);

    const breadcrumbs = [
        { label: "Skills", href: "/skills" },
        { label: department.name, href: `/skills/browse/${department.slug}` },
        { label: project.name, href: `/skills/browse/${department.slug}/${project.slug}` },
        { label: skill.name },
    ];

    return (
        <PageLayout
            title={skill.name}
            description={skill.description || `Sub-skills of ${skill.name}`}
            headerActions={
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/skills/browse/${department.slug}/${project.slug}`}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back to {project.name}
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/skills/${skill.id}`}>
                            View Skill Details
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href={`/skills/new?categoryId=${project.id}&parentSkillId=${skill.id}`}>
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
