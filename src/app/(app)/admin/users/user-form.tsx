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
import { Switch } from "@/components/ui/switch";
import type { Role } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SubmitResult =
  | { success: true; data?: { id: string } }
  | { success: false; error: string };

interface UserFormProps {
  mode: "create" | "edit";
  roles: Role[];
  departments: { id: string; name: string; code: string }[];
  initialData?: {
    id: string;
    employeeId: string;
    name: string;
    email: string | null;
    roleId: string | null;
    departmentId: string | null;
    isActive: boolean;
  };
  onSubmit: (formData: FormData) => Promise<SubmitResult>;
}

export function UserForm({
  mode,
  roles,
  departments,
  initialData,
  onSubmit,
}: UserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    initialData?.roleId ?? null
  );
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(
    initialData?.departmentId ?? null
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("isActive", isActive.toString());
    if (selectedRoleId) {
      formData.set("roleId", selectedRoleId.toString());
    }
    if (selectedDeptId) {
      formData.set("departmentId", selectedDeptId.toString());
    } else {
      formData.set("departmentId", "");
    }

    const result = await onSubmit(formData);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "An error occurred");
      return;
    }

    if (mode === "create" && result.data?.id) {
      router.push(`/admin/users/${result.data.id}`);
    } else {
      router.push("/admin/users");
    }
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
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input
            id="employeeId"
            name="employeeId"
            defaultValue={initialData?.employeeId}
            disabled={mode === "edit"}
            required
            pattern="^[A-Za-z0-9-]+$"
            placeholder="e.g., TECH-001"
            className="uppercase font-bold tracking-wider"
          />
          {mode === "edit" && (
            <p className="text-[10px] text-muted-foreground font-medium">
              Employee ID cannot be changed
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialData?.name}
            required
            placeholder="e.g., John Smith"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="departmentId">Department</Label>
          <Select
            value={selectedDeptId || "none"}
            onValueChange={(val) =>
              setSelectedDeptId(val === "none" ? null : val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Department</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            type="email"
            id="email"
            name="email"
            defaultValue={initialData?.email ?? ""}
            placeholder="e.g., john@company.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">
            PIN {mode === "edit" && "(Leave blank to keep current)"}
          </Label>
          <Input
            type="password"
            id="pin"
            name="pin"
            required={mode === "create"}
            minLength={4}
            maxLength={20}
            placeholder={mode === "create" ? "Enter 4-20 digit PIN" : "••••"}
          />
        </div>

        <div className="space-y-2">
          <Label className="block mb-3">Status</Label>
          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              id="isActive-switch"
            />
            <Label
              htmlFor="isActive-switch"
              className="cursor-pointer font-bold"
            >
              {isActive ? "ACTIVE" : "INACTIVE"}
            </Label>
          </div>
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-[11px] font-black uppercase tracking-widest text-muted-foreground p-0">
          Assign Role
        </legend>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRoleId(role.id)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border p-4 text-left transition-all active:scale-[0.98]",
                selectedRoleId === role.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                  selectedRoleId === role.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                )}
              >
                {selectedRoleId === role.id && <Check className="h-3 w-3" />}
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-wide">
                  {role.name}
                </p>
                {role.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {role.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
        {!selectedRoleId && (
          <p className="text-xs text-danger font-medium">
            Please select a role
          </p>
        )}
      </fieldset>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/users")}
        >
          CANCEL
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !selectedRoleId}
          isLoading={isSubmitting}
        >
          {mode === "create" ? "CREATE USER" : "SAVE CHANGES"}
        </Button>
      </div>
    </form>
  );
}
