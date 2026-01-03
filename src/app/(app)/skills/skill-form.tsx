"use client";

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
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  mode: "create" | "edit";
  initialData?: Skill;
  categories: SkillCategory[];
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id: string }>>;
}

export function SkillForm({ mode, initialData, categories, onSubmit }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresCertification, setRequiresCertification] = useState(
    initialData?.requiresCertification ?? false
  );
  const [hasProficiencyLevels, setHasProficiencyLevels] = useState(
    initialData?.hasProficiencyLevels ?? false
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);

    if (!result.success) {
      setError(result.error || "An error occurred");
      setIsSubmitting(false);
      return;
    }

    router.push("/skills");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create Skill" : "Edit Skill"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
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

          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              name="categoryId"
              defaultValue={initialData?.categoryId || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
