# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

This is a Next.js factory app template with built-in authentication, permissions, and CRUD patterns. Built with Next.js 16 (App Router), React 19, TypeScript, SQLite/LibSQL via Drizzle ORM, and Tailwind CSS 4.

Use this template to build focused factory/industrial apps like:
- Training & Certification Tracking (LMS)
- Problem Solving / Corrective Actions
- Safety Incident Reporting
- 5S / Lean Audits
- Tool Crib / Checkout Systems

See `APP-IDEAS.md` for full list with details.

## Commands

```bash
# Development
bun run dev              # Start dev server with Turbopack

# Type checking & linting (run before commits)
bun run build:check      # TypeScript compilation check
bun run lint             # Check code with Biome
bun run lint:fix         # Auto-fix lint issues

# Testing
bun run test             # Unit tests (watch mode)
bun run test:run         # Unit tests (single run)
bun run e2e              # Playwright e2e tests

# Database
bun run db:push          # Push schema changes to database
bun run db:seed          # Seed development data
bun run db:studio        # Open Drizzle Studio GUI
```

## Architecture

### Route Groups
- `src/app/(app)/` - Main authenticated application
- `src/app/(auth)/` - Authentication routes (login)
- `src/app/api/` - REST API endpoints

### Key Directories
- `src/actions/` - Server Actions for mutations (use `"use server"` directive)
- `src/components/ui/` - 50+ reusable UI primitives (shadcn/Radix pattern)
- `src/components/layout/` - App shell (sidebar, header, nav)
- `src/db/schema.ts` - Drizzle ORM schema
- `src/lib/validations/` - Zod validation schemas
- `src/lib/session.ts` - JWT session management
- `src/lib/permissions.ts` - Permission constants and helpers

### Authentication
- PIN-based login (factory floor friendly)
- JWT in HttpOnly cookie
- CSRF token required for mutations (`x-csrf-token` header)
- Permission pattern: `resource:action` (e.g., `skill:create`, `training:update`)

## Adding a New Entity

Follow this checklist when adding new domain entities:

### 1. Database Schema
```typescript
// src/db/schema.ts
export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});
```

### 2. Permissions
```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  // ... existing
  SKILL_VIEW: "skill:view",
  SKILL_CREATE: "skill:create",
  SKILL_UPDATE: "skill:update",
  SKILL_DELETE: "skill:delete",
} as const;
```

### 3. Validation Schema
```typescript
// src/lib/validations/skills.ts
import { z } from "zod";

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
});
```

### 4. Server Actions
```typescript
// src/actions/skills.ts
"use server";

import { db } from "@/db";
import { skills } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { revalidatePath } from "next/cache";

export async function createSkill(formData: FormData): Promise<ActionResult<{ id: number }>> {
  await requirePermission(PERMISSIONS.SKILL_CREATE);
  // Validate, insert, revalidate...
  revalidatePath("/skills");
  return { success: true, data: { id: result.id } };
}
```

### 5. Routes
```
src/app/(app)/skills/
├── page.tsx              # List - uses PageLayout + DataTable
├── new/page.tsx          # Create - uses SkillForm
├── [id]/page.tsx         # View/Edit - uses SkillForm
├── skill-form.tsx        # Shared form component
├── skills-table.tsx      # Table with columns
└── skill-filters.tsx     # Filter bar
```

### 6. Navigation
```typescript
// src/components/layout/sidebar-nav-config.tsx
{
  label: "Skills",
  href: "/skills",
  icon: BookOpen,
  permission: PERMISSIONS.SKILL_VIEW,
}
```

### 7. Push Schema
```bash
bun run db:push
```

## Code Patterns

### Server Actions
```typescript
"use server";

import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { revalidatePath } from "next/cache";

export async function myAction(formData: FormData): Promise<ActionResult<MyType>> {
  await requirePermission(PERMISSIONS.SOME_PERMISSION);
  // Validate with Zod, perform action...
  revalidatePath("/relevant-path");
  return { success: true, data: result };
}
```

### List Page Pattern
```typescript
import { PageLayout } from "@/components/ui/page-layout";
import { DataTable } from "@/components/ui/data-table";

export default async function ListPage({ searchParams }) {
  const items = await getItems();

  return (
    <PageLayout
      title="Items"
      headerActions={<AddButton />}
      stats={<StatsSection />}
      filters={<Filters searchParams={searchParams} />}
    >
      <ItemsTable items={items} searchParams={searchParams} />
    </PageLayout>
  );
}
```

### Form Component Pattern
```typescript
"use client";

interface FormProps {
  mode: "create" | "edit";
  initialData?: EntityType;
  onSubmit: (formData: FormData) => Promise<ActionResult>;
}

export function EntityForm({ mode, initialData, onSubmit }: FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onSubmit(new FormData(e.currentTarget));
    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    router.push("/entities");
    router.refresh();
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Database Queries
```typescript
import { db } from "@/db";
import { skills } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const results = await db.query.skills.findMany({
  where: eq(skills.isActive, true),
  with: { category: true },
  orderBy: [desc(skills.createdAt)],
});
```

## Key UI Components

| Component | Purpose |
|-----------|---------|
| `PageLayout` | Page structure with header, stats, filters |
| `DataTable` | Tables with sorting, row clicks, empty states |
| `StatsTicker` | Row of stat cards |
| `FilterBar` | Search + filter dropdowns |
| `EmptyState` | No data placeholder |
| `Button`, `Input`, `Badge`, `Card` | Basic primitives |

See `PATTERNS.md` for detailed usage examples.

## User Roles

Default roles: `employee`, `supervisor`, `admin`. Custom roles can be created via Admin UI. Special permission `*` grants all access.

## Import Aliases

Always use `@/` prefix for imports from `src/`:
```typescript
import { db } from "@/db";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
```

## File Naming

- Components: `kebab-case.tsx` (e.g., `skill-form.tsx`)
- Pages: `page.tsx`, layouts: `layout.tsx`
- Actions: `entity-name.ts` (e.g., `skills.ts`)
- Validations: `entity-name.ts` in `src/lib/validations/`

## Before Committing

1. `bun run lint:fix` - Fix lint issues
2. `bun run build:check` - Verify TypeScript compiles
3. `bun run test:run` - Run unit tests

## Reference Docs

- `PATTERNS.md` - Detailed CRUD patterns and component usage
- `LMS.md` - Full implementation plan for Training app (example)
- `APP-IDEAS.md` - Factory app ideas with schemas
- `HANDOFF.md` - Template cleanup status (if still in progress)
