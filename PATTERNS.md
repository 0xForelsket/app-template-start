# Reusable Patterns & Components

This document describes the reusable patterns and components available in this template for building CRUD features.

---

## Table of Contents

1. [Page Structure](#page-structure)
2. [Data Tables](#data-tables)
3. [Forms](#forms)
4. [Server Actions](#server-actions)
5. [Filters](#filters)
6. [Complete CRUD Example](#complete-crud-example)

---

## Page Structure

### PageLayout

The main page wrapper that provides consistent structure.

```tsx
import { PageLayout } from "@/components/ui/page-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function SkillsPage() {
  const skills = await getSkills();
  const stats = await getSkillStats();

  return (
    <PageLayout
      title="Skills Catalog"
      subtitle="Training"
      description={`${stats.total} skills • ${stats.active} active`}
      bgSymbol="SK"
      headerActions={
        <Button asChild>
          <Link href="/skills/new">
            <Plus className="mr-2 h-4 w-4" />
            ADD SKILL
          </Link>
        </Button>
      }
      stats={<StatsSection stats={stats} />}
      filters={<SkillFilters searchParams={searchParams} />}
    >
      <SkillsTable skills={skills} />
    </PageLayout>
  );
}
```

**Props:**
- `title` - Main page title
- `subtitle` - Small text above title
- `description` - Text below title (often stats summary)
- `bgSymbol` - Large background decorative text
- `headerActions` - Buttons/links in header
- `stats` - Stats section (use `StatsTicker`)
- `filters` - Filter bar section
- `children` - Main content (usually a table)

### StatsTicker

Row of stat cards with icons.

```tsx
import { StatsTicker } from "@/components/ui/stats-ticker";
import { BookOpen, CheckCircle, Clock, AlertTriangle } from "lucide-react";

<StatsTicker
  stats={[
    { label: "Total Skills", value: 24, icon: BookOpen, variant: "default" },
    { label: "Active", value: 20, icon: CheckCircle, variant: "success" },
    { label: "Expiring Soon", value: 3, icon: Clock, variant: "warning" },
    { label: "Expired", value: 1, icon: AlertTriangle, variant: "danger" },
  ]}
/>
```

**Variants:** `default`, `primary`, `success`, `warning`, `danger`

---

## Data Tables

### DataTable

Full-featured table component with sorting, row clicks, and empty states.

```tsx
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

interface Skill {
  id: number;
  name: string;
  category: string;
  isActive: boolean;
}

const columns: ColumnDef<Skill>[] = [
  {
    id: "name",
    header: "Name",
    sortable: true,
    cell: (row) => (
      <span className="font-medium">{row.name}</span>
    ),
  },
  {
    id: "category",
    header: "Category",
    sortable: true,
    cell: (row) => row.category,
    hideBelow: "md", // Hide on mobile
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <Badge variant={row.isActive ? "success" : "secondary"}>
        {row.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export function SkillsTable({ skills, searchParams }) {
  return (
    <DataTable
      columns={columns}
      data={skills}
      searchParams={searchParams}
      getRowId={(row) => row.id}
      getRowHref={(row) => `/skills/${row.id}`}
      emptyMessage="No skills found"
    />
  );
}
```

**Key Props:**
- `columns` - Column definitions
- `data` - Array of data
- `searchParams` - For URL-based sorting
- `getRowId` - Unique key for each row
- `getRowHref` - Makes rows clickable links
- `onRowClick` - Alternative to href for custom click handling
- `emptyMessage` - Shown when no data
- `compact` - Reduces padding
- `selectable` - Enables row selection checkboxes

**Column Options:**
- `id` - Unique column identifier
- `header` - Header text
- `sortable` - Enable sorting
- `cell` - Render function `(row, index) => ReactNode`
- `hideBelow` - Responsive hide (`sm`, `md`, `lg`, `xl`)
- `align` - Text alignment (`left`, `center`, `right`)
- `width` - Fixed width

### EmptyState

Shown when no data is available.

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";

<EmptyState
  title="No skills found"
  description="Add your first skill to get started."
  icon={BookOpen}
  action={
    <Button asChild>
      <Link href="/skills/new">Add Skill</Link>
    </Button>
  }
/>
```

---

## Forms

### Form Component Pattern

Create a reusable form component that works for both create and edit modes.

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SkillFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: number;
    name: string;
    description: string | null;
    categoryId: number | null;
  };
  categories: { id: number; name: string }[];
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function SkillForm({ mode, initialData, categories, onSubmit }: SkillFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "An error occurred");
      return;
    }

    router.push("/skills");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Skill Name
          </label>
          <Input
            name="name"
            defaultValue={initialData?.name}
            required
            placeholder="e.g., Forklift Operation"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Category
          </label>
          <select
            name="categoryId"
            defaultValue={initialData?.categoryId ?? ""}
            className="w-full rounded-xl border px-4 py-3"
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Description
          </label>
          <textarea
            name="description"
            defaultValue={initialData?.description ?? ""}
            rows={3}
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Describe this skill..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t pt-6">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Skill" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
```

### Form Layout Helpers

```tsx
import { FieldGroup, FormGrid, FormSection } from "@/components/ui/form-layout";

<FormSection title="Basic Information">
  <FormGrid>
    <FieldGroup label="Name" required error={errors.name}>
      <Input name="name" />
    </FieldGroup>
    <FieldGroup label="Code" description="Short identifier">
      <Input name="code" />
    </FieldGroup>
  </FormGrid>
</FormSection>

<FormSection title="Settings">
  <FormGrid>
    <FieldGroup label="Category">
      <Select name="categoryId" />
    </FieldGroup>
  </FormGrid>
</FormSection>
```

### Create Page

```tsx
// src/app/(app)/skills/new/page.tsx
import { SkillForm } from "../skill-form";
import { createSkill } from "@/actions/skills";
import { getCategories } from "@/actions/skills";

export default async function NewSkillPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Create Skill</h1>
      <SkillForm
        mode="create"
        categories={categories}
        onSubmit={createSkill}
      />
    </div>
  );
}
```

### Edit Page

```tsx
// src/app/(app)/skills/[id]/page.tsx
import { SkillForm } from "../skill-form";
import { getSkillById, updateSkill, getCategories } from "@/actions/skills";
import { notFound } from "next/navigation";

export default async function EditSkillPage({ params }: { params: { id: string } }) {
  const [skill, categories] = await Promise.all([
    getSkillById(params.id),
    getCategories(),
  ]);

  if (!skill) notFound();

  // Bind the ID to the update action
  const updateWithId = updateSkill.bind(null, skill.id);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Edit Skill</h1>
      <SkillForm
        mode="edit"
        initialData={skill}
        categories={categories}
        onSubmit={updateWithId}
      />
    </div>
  );
}
```

### Delete Button

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  id: number;
  name: string;
  onDelete: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export function DeleteButton({ id, name, onDelete }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await onDelete(id);
    setIsDeleting(false);

    if (result.success) {
      router.push("/skills");
      router.refresh();
    }
  }

  if (!showConfirm) {
    return (
      <Button variant="destructive" onClick={() => setShowConfirm(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Delete "{name}"?</span>
      <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
        Cancel
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
      </Button>
    </div>
  );
}
```

---

## Server Actions

### Action Pattern

```tsx
// src/actions/skills.ts
"use server";

import { db } from "@/db";
import { skills } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { skillSchema } from "@/lib/validations/skills";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// CREATE
export async function createSkill(formData: FormData): Promise<ActionResult<{ id: number }>> {
  await requirePermission(PERMISSIONS.SKILL_CREATE);

  try {
    const data = skillSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      categoryId: formData.get("categoryId") ? Number(formData.get("categoryId")) : null,
    });

    const [result] = await db.insert(skills).values(data).returning({ id: skills.id });

    revalidatePath("/skills");
    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("Failed to create skill:", error);
    return { success: false, error: "Failed to create skill" };
  }
}

// READ (single)
export async function getSkillById(id: number) {
  await requirePermission(PERMISSIONS.SKILL_VIEW);

  return db.query.skills.findFirst({
    where: eq(skills.id, id),
    with: { category: true },
  });
}

// READ (list)
export async function getSkills() {
  await requirePermission(PERMISSIONS.SKILL_VIEW);

  return db.query.skills.findMany({
    orderBy: (skills, { asc }) => [asc(skills.name)],
    with: { category: true },
  });
}

// UPDATE
export async function updateSkill(id: number, formData: FormData): Promise<ActionResult<void>> {
  await requirePermission(PERMISSIONS.SKILL_UPDATE);

  try {
    const data = skillSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      categoryId: formData.get("categoryId") ? Number(formData.get("categoryId")) : null,
    });

    await db.update(skills).set(data).where(eq(skills.id, id));

    revalidatePath("/skills");
    revalidatePath(`/skills/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update skill:", error);
    return { success: false, error: "Failed to update skill" };
  }
}

// DELETE
export async function deleteSkill(id: number): Promise<ActionResult<void>> {
  await requirePermission(PERMISSIONS.SKILL_DELETE);

  try {
    await db.delete(skills).where(eq(skills.id, id));

    revalidatePath("/skills");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete skill:", error);
    return { success: false, error: "Failed to delete skill" };
  }
}
```

### ActionResult Type

```tsx
// src/lib/types/actions.ts
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

### Validation with Zod

```tsx
// src/lib/validations/skills.ts
import { z } from "zod";

export const skillSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  categoryId: z.number().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type SkillInput = z.infer<typeof skillSchema>;
```

---

## Filters

### FilterBar

Combines search input with filter dropdowns.

```tsx
import { FilterBar } from "@/components/ui/filter-bar";

interface SkillFiltersProps {
  searchParams: { search?: string; category?: string; status?: string };
}

export function SkillFilters({ searchParams }: SkillFiltersProps) {
  return (
    <FilterBar
      searchPlaceholder="Search skills..."
      searchParamName="search"
      defaultSearch={searchParams.search}
      filters={[
        {
          name: "category",
          label: "Category",
          options: [
            { value: "all", label: "All Categories" },
            { value: "safety", label: "Safety" },
            { value: "equipment", label: "Equipment" },
            { value: "quality", label: "Quality" },
          ],
          defaultValue: searchParams.category || "all",
        },
        {
          name: "status",
          label: "Status",
          options: [
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ],
          defaultValue: searchParams.status || "all",
        },
      ]}
    />
  );
}
```

### FilterSelect (Individual)

For custom filter layouts.

```tsx
import { FilterSelect } from "@/components/ui/filter-select";

<FilterSelect
  name="category"
  label="Category"
  options={[
    { value: "all", label: "All" },
    { value: "safety", label: "Safety" },
  ]}
  defaultValue={searchParams.category || "all"}
/>
```

---

## Complete CRUD Example

Here's a complete file structure for a "Skills" entity:

```
src/
├── app/(app)/skills/
│   ├── page.tsx                 # List page
│   ├── new/
│   │   └── page.tsx             # Create page
│   ├── [id]/
│   │   ├── page.tsx             # View/Edit page
│   │   └── edit/page.tsx        # (optional) Separate edit page
│   ├── skill-form.tsx           # Shared form component
│   ├── skills-table.tsx         # Table component
│   ├── skill-filters.tsx        # Filters component
│   └── delete-skill-button.tsx  # Delete button
├── actions/
│   └── skills.ts                # Server actions (CRUD)
├── lib/validations/
│   └── skills.ts                # Zod schemas
└── db/
    └── schema.ts                # Add skills table
```

### Checklist for New Entity

1. [ ] Add table to `src/db/schema.ts`
2. [ ] Add permissions to `src/lib/permissions.ts`
3. [ ] Create Zod schema in `src/lib/validations/`
4. [ ] Create server actions in `src/actions/`
5. [ ] Add routes in `src/app/(app)/`
6. [ ] Add to sidebar nav in `src/components/layout/sidebar-nav-config.tsx`
7. [ ] Run `bun run db:push` to update database

---

## UI Components Reference

| Component | Import | Purpose |
|-----------|--------|---------|
| `Button` | `@/components/ui/button` | Buttons with variants |
| `Input` | `@/components/ui/input` | Text input |
| `Badge` | `@/components/ui/badge` | Status badges |
| `Card` | `@/components/ui/card` | Card container |
| `Dialog` | `@/components/ui/dialog` | Modal dialogs |
| `DropdownMenu` | `@/components/ui/dropdown-menu` | Context menus |
| `Tabs` | `@/components/ui/tabs` | Tab navigation |
| `DataTable` | `@/components/ui/data-table` | Tables with sorting |
| `PageLayout` | `@/components/ui/page-layout` | Page structure |
| `PageHeader` | `@/components/ui/page-header` | Page headers |
| `StatsTicker` | `@/components/ui/stats-ticker` | Stats row |
| `FilterBar` | `@/components/ui/filter-bar` | Search + filters |
| `EmptyState` | `@/components/ui/empty-state` | No data state |
| `Skeleton` | `@/components/ui/skeleton` | Loading states |

See `src/app/(app)/design-system/` for live examples of all components.
