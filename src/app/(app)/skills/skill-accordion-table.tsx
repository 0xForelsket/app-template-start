"use client";

import type { SkillCategoryWithHierarchy } from "@/actions/skill-categories";
import type { SkillWithHierarchy } from "@/actions/skills";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SkillAccordionTableProps {
  departments: SkillCategoryWithHierarchy[];
  className?: string;
}

export function SkillAccordionTable({
  departments,
  className,
}: SkillAccordionTableProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-black uppercase text-foreground">
            No Departments
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-[300px]">
            No departments have been created yet. Create a department to start
            organizing skills.
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {departments.map((dept) => (
            <DepartmentRow key={dept.id} department={dept} />
          ))}
        </Accordion>
      )}
    </div>
  );
}

function DepartmentRow({
  department,
}: {
  department: SkillCategoryWithHierarchy;
}) {
  return (
    <AccordionItem value={department.id} className="border-border/50">
      <AccordionTrigger className="hover:no-underline py-3 px-4">
        <div className="flex items-center gap-4 flex-1">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm"
            style={{ backgroundColor: department.color || "var(--primary)" }}
          >
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground truncate">
                {department.name}
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {department.code}
              </Badge>
            </div>
            {department.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {department.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>
                {department.childCount ?? department.children?.length ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{department.skillCount ?? 0}</span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <div className="pl-14 pr-4 pb-4 space-y-2">
          {department.children && department.children.length > 0 ? (
            <Accordion type="multiple" className="space-y-1">
              {department.children.map((area) => (
                <AreaRow
                  key={area.id}
                  area={area}
                  departmentColor={department.color}
                />
              ))}
            </Accordion>
          ) : (
            <div className="text-xs text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
              No areas in this department
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AreaRow({
  area,
  departmentColor,
}: {
  area: SkillCategoryWithHierarchy;
  departmentColor?: string | null;
}) {
  const [skills, setSkills] = useState<SkillWithHierarchy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadSkills = async () => {
    if (hasLoaded) return;
    setIsLoading(true);
    try {
      // Dynamically import to avoid circular dependency
      const { getSkillsByCategory } = await import("@/actions/skills");
      const result = await getSkillsByCategory(area.id, true);
      setSkills(result);
      setHasLoaded(true);
    } catch (error) {
      console.error("Failed to load skills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AccordionItem
      value={area.id}
      className="border-border/30 bg-muted/20 rounded-lg overflow-hidden"
    >
      <div onMouseDown={loadSkills}>
        <AccordionTrigger className="hover:no-underline py-2.5 px-3">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{
                backgroundColor:
                  area.color || departmentColor || "var(--primary)",
                opacity: 0.8,
              }}
            >
              <LayoutGrid className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">
                  {area.name}
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {area.code}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{area.skillCount ?? skills.length}</span>
            </div>
          </div>
        </AccordionTrigger>
      </div>
      <AccordionContent className="pb-0">
        <div className="pl-11 pr-3 pb-3">
          {isLoading ? (
            <div className="text-xs text-muted-foreground py-3 text-center">
              Loading skills...
            </div>
          ) : skills.length > 0 ? (
            <div className="space-y-1">
              {skills.map((skill) => (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  level={0}
                  areaColor={area.color || departmentColor}
                />
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground py-3 text-center bg-muted/30 rounded-md">
              No skills in this area
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function SkillRow({
  skill,
  level,
  areaColor,
}: {
  skill: SkillWithHierarchy;
  level: number;
  areaColor?: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [childSkills, setChildSkills] = useState<SkillWithHierarchy[]>(
    skill.childSkills || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const hasChildren = (skill.childCount ?? childSkills.length) > 0;

  const loadChildren = async () => {
    if (childSkills.length > 0 || !hasChildren) return;
    setIsLoading(true);
    try {
      const { getSubSkills } = await import("@/actions/skills");
      const result = await getSubSkills(skill.id);
      setChildSkills(result);
    } catch (error) {
      console.error("Failed to load sub-skills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isExpanded) {
      loadChildren();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-2 rounded-md transition-colors group",
          hasChildren ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/30"
        )}
        onClick={hasChildren ? handleToggle : undefined}
        onKeyDown={
          hasChildren
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle();
                }
              }
            : undefined
        }
        role={hasChildren ? "button" : undefined}
        tabIndex={hasChildren ? 0 : undefined}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren ? (
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <Layers className="h-4 w-4" />
              </motion.div>
            ) : isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Skill Icon */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gradient-to-br from-primary/80 to-primary/60">
          <BookOpen className="h-3.5 w-3.5 text-white" />
        </div>

        {/* Skill Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {skill.name}
            </span>
            <Badge variant="outline" className="font-mono text-[10px]">
              {skill.code}
            </Badge>
            {skill.requiresCertification && (
              <Badge variant="secondary" className="text-[10px] gap-0.5">
                <Award className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasChildren && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {skill.childCount ?? childSkills.length} sub
            </span>
          )}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/skills/${skill.id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Child Skills */}
      {isExpanded && childSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-0.5 ml-2 border-l-2 border-border/30"
        >
          {childSkills.map((child) => (
            <SkillRow
              key={child.id}
              skill={child}
              level={level + 1}
              areaColor={areaColor}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
