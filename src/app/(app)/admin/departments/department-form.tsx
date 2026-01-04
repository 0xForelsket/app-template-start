"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/types/actions";
import { Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  employeeId: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  managerId: string | null;
}

interface Props {
  mode: "create" | "edit";
  initialData?: Department;
  users: User[];
  onSubmit: (formData: FormData) => Promise<ActionResult<{ id?: string }>>;
}

export function DepartmentForm({ mode, initialData, users, onSubmit }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string>(
    initialData?.managerId || "none"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("managerId", managerId === "none" ? "" : managerId);

    const result = await onSubmit(formData);

    if (!result.success) {
      setError(result.error || "An error occurred");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin/departments");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Department Name *</Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={initialData?.name || ""}
            required
            placeholder="e.g., QUALITY CONTROL"
            className="font-bold uppercase tracking-wider"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Department Code *</Label>
          <Input
            type="text"
            id="code"
            name="code"
            defaultValue={initialData?.code || ""}
            required
            placeholder="e.g., QC"
            className="font-bold uppercase tracking-wider"
          />
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Short identifier for URLs and reports
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData?.description || ""}
          placeholder="Describe the department's responsibilities"
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="managerId">Department Manager</Label>
        <Select value={managerId} onValueChange={setManagerId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Manager Assigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.employeeId})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 mr-2" />
          CANCEL
        </Button>
        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
          {!isSubmitting && <Save className="h-4 w-4 mr-2" />}
          {mode === "create" ? "CREATE DEPARTMENT" : "SAVE CHANGES"}
        </Button>
      </div>
    </form>
  );
}
