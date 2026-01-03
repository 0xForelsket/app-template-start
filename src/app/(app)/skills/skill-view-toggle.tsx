"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Grid3X3, List, TreePine } from "lucide-react";

export type SkillViewType = "cards" | "table" | "tree";

interface SkillViewToggleProps {
    activeView: SkillViewType;
    onViewChange: (view: SkillViewType) => void;
    className?: string;
}

const views: { id: SkillViewType; label: string; icon: typeof Grid3X3 }[] = [
    { id: "cards", label: "Cards", icon: Grid3X3 },
    { id: "table", label: "Table", icon: List },
    { id: "tree", label: "Tree", icon: TreePine },
];

export function SkillViewToggle({
    activeView,
    onViewChange,
    className,
}: SkillViewToggleProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-border",
                className
            )}
        >
            {views.map((view) => {
                const Icon = view.icon;
                const isActive = activeView === view.id;

                return (
                    <button
                        key={view.id}
                        type="button"
                        onClick={() => onViewChange(view.id)}
                        className={cn(
                            "relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                            isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="skill-view-toggle"
                                className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                            />
                        )}
                        <span className="relative flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{view.label}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
