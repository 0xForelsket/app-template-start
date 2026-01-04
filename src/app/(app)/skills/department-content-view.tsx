"use client";

import type { SkillCategoryWithHierarchy } from "@/actions/skill-categories";
import type { SkillWithHierarchy } from "@/actions/skills";
import { Badge } from "@/components/ui/badge";
import { type BreadcrumbItem, Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Building2,
  ChevronRight,
  Layers,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";

interface DepartmentContentViewProps {
  breadcrumbs: BreadcrumbItem[];
  areas: SkillCategoryWithHierarchy[];
  skills: SkillWithHierarchy[];
  department: SkillCategoryWithHierarchy;
}

export function DepartmentContentView({
  breadcrumbs,
  areas,
  skills,
  department,
}: DepartmentContentViewProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const hasAreas = areas.length > 0;
  const hasSkills = skills.length > 0;
  const isEmpty = !hasAreas && !hasSkills;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="bg-muted/30 rounded-xl p-4 border border-border">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}

      {/* Current Context Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg"
          style={{
            backgroundColor: department.color || "var(--primary)",
          }}
        >
          <Building2 className="h-7 w-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
            {department.name}
          </h2>
          {department.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {department.description}
            </p>
          )}
        </div>
      </div>

      {/* Areas Section */}
      {hasAreas && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Areas ({areas.length})
            </h3>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {areas.map((area) => (
              <motion.div key={area.id} variants={itemVariants}>
                <Link href={`/skills/browse/${department.slug}/${area.slug}`}>
                  <Card className="group relative overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer">
                    <div
                      className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, ${area.color || department.color || "#6366f1"} 0%, transparent 100%)`,
                      }}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md"
                          style={{
                            backgroundColor:
                              area.color ||
                              department.color ||
                              "var(--primary)",
                          }}
                        >
                          <LayoutGrid className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {area.code}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4 text-base font-black uppercase tracking-tight">
                        {area.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {area.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {area.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{area.skillCount ?? 0} Skills</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Skills Section */}
      {hasSkills && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Department Skills ({skills.length})
            </h3>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {skills.map((skill) => (
              <motion.div key={skill.id} variants={itemVariants}>
                <Link
                  href={
                    (skill.childCount ?? 0) > 0
                      ? `/skills/browse/${department.slug}/_direct/${skill.code.toLowerCase()}`
                      : `/skills/${skill.id}`
                  }
                >
                  <Card className="group relative overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          {skill.requiresCertification && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] gap-1"
                            >
                              <Award className="h-3 w-3" />
                              Cert
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {skill.code}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="mt-4 text-base font-black uppercase tracking-tight">
                        {skill.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {skill.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {skill.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {(skill.childCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Layers className="h-3.5 w-3.5" />
                              <span>{skill.childCount} Sub-skills</span>
                            </div>
                          )}
                          {skill.requiredTrainingHours && (
                            <div className="flex items-center gap-1.5">
                              <span>
                                {skill.requiredTrainingHours}h training
                              </span>
                            </div>
                          )}
                        </div>
                        {(skill.childCount ?? 0) > 0 && (
                          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-black uppercase text-foreground">
            No Content Yet
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-[300px]">
            This department has no areas or skills yet. Add skills directly to
            this department or create areas to organize them.
          </p>
        </div>
      )}
    </div>
  );
}
