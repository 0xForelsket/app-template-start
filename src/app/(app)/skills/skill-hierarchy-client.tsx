"use client";

import { useState } from "react";
import type { SkillCategoryWithHierarchy } from "@/actions/skill-categories";
import { SkillAccordionTable } from "./skill-accordion-table";
import { SkillCardsView } from "./skill-cards-view";
import { SkillSidebarTree } from "./skill-sidebar-tree";
import { SkillViewToggle, type SkillViewType } from "./skill-view-toggle";
import { useRouter } from "next/navigation";

interface SkillHierarchyClientProps {
    departments: SkillCategoryWithHierarchy[];
}

export function SkillHierarchyClient({
    departments,
}: SkillHierarchyClientProps) {
    const [activeView, setActiveView] = useState<SkillViewType>("cards");
    const router = useRouter();

    return (
        <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex justify-between items-center">
                <SkillViewToggle activeView={activeView} onViewChange={setActiveView} />
                <p className="text-xs text-muted-foreground">
                    {departments.length} department{departments.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Cards View - Default for employees */}
            {activeView === "cards" && (
                <SkillCardsView
                    breadcrumbs={[{ label: "Skills", href: "/skills" }]}
                    departments={departments}
                    currentLevel="departments"
                />
            )}

            {/* Accordion Table View - For admins/managers */}
            {activeView === "table" && (
                <SkillAccordionTable departments={departments} />
            )}

            {/* Sidebar Tree View - File explorer style */}
            {activeView === "tree" && (
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
                    <SkillSidebarTree
                        departments={departments}
                        className="h-[600px]"
                        onItemClick={(item) => router.push(item.href)}
                    />
                    <div className="bg-muted/30 rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                            <span className="text-3xl">👈</span>
                        </div>
                        <h3 className="text-lg font-black uppercase text-foreground">
                            Select an Item
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-[300px]">
                            Use the tree on the left to navigate through departments,
                            projects, and skills.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
