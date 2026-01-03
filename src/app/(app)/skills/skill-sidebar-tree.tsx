"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award,
    BookOpen,
    Building2,
    ChevronDown,
    ChevronRight,
    FolderKanban,
    Layers,
    Search,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import type { SkillCategoryWithHierarchy } from "@/actions/skill-categories";
import type { SkillWithHierarchy } from "@/actions/skills";

interface SkillTreeItem {
    id: string;
    name: string;
    code: string;
    type: "department" | "project" | "skill";
    color?: string | null;
    href: string;
    children?: SkillTreeItem[];
    hasChildren: boolean;
    requiresCertification?: boolean;
}

interface SkillSidebarTreeProps {
    departments: SkillCategoryWithHierarchy[];
    skills?: SkillWithHierarchy[];
    className?: string;
    onItemClick?: (item: SkillTreeItem) => void;
}

export function SkillSidebarTree({
    departments,
    skills,
    className,
    onItemClick,
}: SkillSidebarTreeProps) {
    const [search, setSearch] = useState("");
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const pathname = usePathname();

    // Build tree structure
    const treeItems = useMemo<SkillTreeItem[]>(() => {
        return departments.map((dept) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            type: "department" as const,
            color: dept.color,
            href: `/skills/browse/${dept.slug}`,
            hasChildren: (dept.children?.length ?? 0) > 0,
            children: dept.children?.map((proj) => ({
                id: proj.id,
                name: proj.name,
                code: proj.code,
                type: "project" as const,
                color: proj.color || dept.color,
                href: `/skills/browse/${dept.slug}/${proj.slug}`,
                hasChildren: (proj.skillCount ?? 0) > 0,
                children: [], // Skills loaded on demand
            })),
        }));
    }, [departments]);

    const toggleNode = (id: string) => {
        const next = new Set(expandedNodes);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setExpandedNodes(next);
    };

    const expandAll = () => {
        const allIds = new Set<string>();
        const collectIds = (items: SkillTreeItem[]) => {
            for (const item of items) {
                allIds.add(item.id);
                if (item.children) {
                    collectIds(item.children);
                }
            }
        };
        collectIds(treeItems);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    // Filter items based on search
    const filterItems = (
        items: SkillTreeItem[],
        term: string
    ): SkillTreeItem[] => {
        if (!term) return items;
        const lowerTerm = term.toLowerCase();

        return items.filter((item) => {
            const matches =
                item.name.toLowerCase().includes(lowerTerm) ||
                item.code.toLowerCase().includes(lowerTerm);

            if (matches) return true;

            if (item.children) {
                const filteredChildren = filterItems(item.children, term);
                if (filteredChildren.length > 0) return true;
            }

            return false;
        });
    };

    const filteredItems = filterItems(treeItems, search);

    return (
        <div
            className={cn(
                "flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden",
                className
            )}
        >
            {/* Toolbar */}
            <div className="p-3 border-b border-border bg-muted/30 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={expandAll}
                        className="text-[10px] font-bold uppercase tracking-wider h-7 px-2"
                    >
                        Expand All
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={collapseAll}
                        className="text-[10px] font-bold uppercase tracking-wider h-7 px-2"
                    >
                        Collapse
                    </Button>
                </div>
            </div>

            {/* Tree Content */}
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Layers className="h-10 w-10 text-muted-foreground/30 mb-3" />
                            <p className="text-xs font-bold text-muted-foreground uppercase">
                                {search ? "No matches found" : "No departments"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {filteredItems.map((item) => (
                                <TreeNode
                                    key={item.id}
                                    item={item}
                                    level={0}
                                    expandedNodes={expandedNodes}
                                    onToggle={toggleNode}
                                    isActive={pathname.includes(item.id)}
                                    searchTerm={search}
                                    onItemClick={onItemClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

interface TreeNodeProps {
    item: SkillTreeItem;
    level: number;
    expandedNodes: Set<string>;
    onToggle: (id: string) => void;
    isActive: boolean;
    searchTerm: string;
    onItemClick?: (item: SkillTreeItem) => void;
}

function TreeNode({
    item,
    level,
    expandedNodes,
    onToggle,
    isActive,
    searchTerm,
    onItemClick,
}: TreeNodeProps) {
    const isExpanded = expandedNodes.has(item.id) || searchTerm.length > 0;

    const getIcon = () => {
        switch (item.type) {
            case "department":
                return Building2;
            case "project":
                return FolderKanban;
            case "skill":
                return BookOpen;
        }
    };

    const Icon = getIcon();

    return (
        <div>
            <div
                className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors cursor-pointer",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50 text-foreground"
                )}
                style={{ paddingLeft: `${8 + level * 16}px` }}
            >
                {/* Toggle Button */}
                {item.hasChildren ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(item.id);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
                    >
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </motion.div>
                    </button>
                ) : (
                    <div className="w-5" />
                )}

                {/* Icon */}
                <div
                    className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded",
                        item.type === "skill"
                            ? "bg-gradient-to-br from-primary/80 to-primary/60"
                            : ""
                    )}
                    style={
                        item.type !== "skill"
                            ? { backgroundColor: item.color || "var(--primary)" }
                            : undefined
                    }
                >
                    <Icon className="h-3.5 w-3.5 text-white" />
                </div>

                {/* Label */}
                <Link
                    href={item.href}
                    className="flex-1 min-w-0 text-sm font-medium truncate"
                    onClick={() => onItemClick?.(item)}
                >
                    {item.name}
                </Link>

                {/* Badges */}
                <div className="flex items-center gap-1 shrink-0">
                    {item.requiresCertification && (
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <Badge
                        variant="secondary"
                        className="text-[9px] font-mono h-4 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        {item.code}
                    </Badge>
                </div>
            </div>

            {/* Children */}
            <AnimatePresence>
                {isExpanded && item.children && item.children.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {item.children.map((child) => (
                            <TreeNode
                                key={child.id}
                                item={child}
                                level={level + 1}
                                expandedNodes={expandedNodes}
                                onToggle={onToggle}
                                isActive={false}
                                searchTerm={searchTerm}
                                onItemClick={onItemClick}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
