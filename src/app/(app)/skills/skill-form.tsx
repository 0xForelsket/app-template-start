"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Skill, SkillCategory } from "@/db/schema";
import type { ActionResult } from "@/lib/types/actions";
import { BookOpen, Building2, Layers, LayoutGrid } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

interface CategoryWithParent extends SkillCategory {
  parent?: SkillCategory | null;
}

interface Props {
  mode: "create" | "edit";
  initialData?: Skill & { parentSkill?: Skill | null };
  categories: CategoryWithParent[];
  parentSkills?: Skill[];
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
}

export function SkillForm({
  mode,
  initialData,
  categories,
  parentSkills = [],
  onSubmit,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL params (for creating from browse page)
  const urlCategoryId = searchParams.get("categoryId");
  const urlParentSkillId = searchParams.get("parentSkillId");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresCertification, setRequiresCertification] = useState(
    initialData?.requiresCertification ?? false
  );
  const [hasProficiencyLevels, setHasProficiencyLevels] = useState(
    initialData?.hasProficiencyLevels ?? false
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialData?.categoryId || urlCategoryId || ""
  );
  const [selectedParentSkillId, setSelectedParentSkillId] = useState(
    initialData?.parentSkillId || urlParentSkillId || ""
  );

  // Group categories by type
  const groupedCategories = useMemo(() => {
    const departments: CategoryWithParent[] = [];
    const areas: CategoryWithParent[] = [];

    for (const cat of categories) {
      if (cat.type === "department") {
        departments.push(cat);
      } else {
        areas.push(cat);
      }
    }

    return { departments, areas };
  }, [categories]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Add parentSkillId if selected
    if (selectedParentSkillId) {
      formData.set("parentSkillId", selectedParentSkillId);
    }

    const result = await onSubmit(formData);

    if (!result.success) {
      setError(result.error || "An error occurred");
      setIsSubmitting(false);
      return;
    }

    router.push("/skills");
    router.refresh();
  }

  // Filter parent skills to only show those in the same category
  const availableParentSkills = useMemo(() => {
    if (!selectedCategoryId) return parentSkills;
    return parentSkills.filter(
      (s) => s.categoryId === selectedCategoryId && s.id !== initialData?.id
    );
  }, [parentSkills, selectedCategoryId, initialData?.id]);

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {mode === "create" ? "Create Skill" : "Edit Skill"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Parent skill badge if creating sub-skill */}
          {(initialData?.parentSkill || urlParentSkillId) && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Creating sub-skill of:
                </span>
                <Badge variant="secondary" className="font-mono">
                  {initialData?.parentSkill?.code || "Parent Skill"}
                </Badge>
                <span className="font-medium">
                  {initialData?.parentSkill?.name}
                </span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initialData?.name || ""}
                required
                placeholder="e.g., Lockout/Tagout (LOTO)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                name="code"
                defaultValue={initialData?.code || ""}
                required
                placeholder="e.g., LOTO"
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Uppercase letters, numbers, and hyphens only
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description || ""}
              placeholder="Describe the skill and its requirements"
              rows={3}
            />
          </div>

          {/* Hierarchy Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Hierarchy
            </h3>

            {/* Category selection */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">
                <span className="flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Area / Department
                </span>
              </Label>
              <Select
                name="categoryId"
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area/department" />
                </SelectTrigger>
                <SelectContent>
                  {groupedCategories.areas.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-bold uppercase text-muted-foreground bg-muted/50">
                        Areas
                      </div>
                      {groupedCategories.areas.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded"
                              style={{
                                backgroundColor:
                                  category.color || "var(--primary)",
                              }}
                            />
                            <span>{category.name}</span>
                            {category.parent && (
                              <span className="text-xs text-muted-foreground">
                                ({category.parent.name})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {groupedCategories.departments.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-bold uppercase text-muted-foreground bg-muted/50 mt-1">
                        Departments
                      </div>
                      {groupedCategories.departments.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Parent Skill Selection (for sub-skills) */}
            {availableParentSkills.length > 0 && !urlParentSkillId && (
              <div className="space-y-2">
                <Label htmlFor="parentSkillId">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Parent Skill (optional)
                  </span>
                </Label>
                <Select
                  value={selectedParentSkillId}
                  onValueChange={setSelectedParentSkillId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent (root skill)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No parent (root skill)</SelectItem>
                    {availableParentSkills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {skill.code}
                          </Badge>
                          <span>{skill.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Make this a sub-skill of another skill
                </p>
              </div>
            )}

            {/* Hidden input for parentSkillId from URL */}
            {urlParentSkillId && (
              <input
                type="hidden"
                name="parentSkillId"
                value={urlParentSkillId}
              />
            )}
          </div>

          {/* Proficiency Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Proficiency Settings</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="hasProficiencyLevels"
                name="hasProficiencyLevels"
                checked={hasProficiencyLevels}
                onCheckedChange={setHasProficiencyLevels}
                value="true"
              />
              <Label htmlFor="hasProficiencyLevels">
                Track proficiency levels
              </Label>
            </div>
            {hasProficiencyLevels && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="maxProficiencyLevel">Maximum Level</Label>
                <Input
                  id="maxProficiencyLevel"
                  name="maxProficiencyLevel"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={initialData?.maxProficiencyLevel || 3}
                  className="w-24"
                />
              </div>
            )}
          </div>

          {/* Certification Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Certification Settings</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="requiresCertification"
                name="requiresCertification"
                checked={requiresCertification}
                onCheckedChange={setRequiresCertification}
                value="true"
              />
              <Label htmlFor="requiresCertification">
                Requires certification
              </Label>
            </div>
            {requiresCertification && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="certificationValidityMonths">
                  Certification Validity (months)
                </Label>
                <Input
                  id="certificationValidityMonths"
                  name="certificationValidityMonths"
                  type="number"
                  min={1}
                  max={120}
                  defaultValue={initialData?.certificationValidityMonths || ""}
                  placeholder="Leave empty for no expiration"
                  className="w-48"
                />
              </div>
            )}
          </div>

          {/* Training Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Training Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="requiredTrainingHours">
                Required Training Hours
              </Label>
              <Input
                id="requiredTrainingHours"
                name="requiredTrainingHours"
                type="number"
                min={0}
                step={1}
                defaultValue={initialData?.requiredTrainingHours || ""}
                placeholder="e.g., 8"
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <Label>Allowed Training Types</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowOJT"
                    name="allowOJT"
                    defaultChecked={initialData?.allowOJT ?? true}
                    value="true"
                  />
                  <Label htmlFor="allowOJT">On-the-Job (OJT)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowClassroom"
                    name="allowClassroom"
                    defaultChecked={initialData?.allowClassroom ?? true}
                    value="true"
                  />
                  <Label htmlFor="allowClassroom">Classroom</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowOnline"
                    name="allowOnline"
                    defaultChecked={initialData?.allowOnline ?? true}
                    value="true"
                  />
                  <Label htmlFor="allowOnline">Online</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={initialData?.isActive ?? true}
                value="true"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Skill"
                  : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
