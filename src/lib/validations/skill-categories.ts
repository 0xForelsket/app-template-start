import { z } from "zod";

export const categoryTypes = ["department", "area"] as const;
export type CategoryType = (typeof categoryTypes)[number];

export const skillCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20)
    .regex(
      /^[A-Z0-9-]+$/,
      "Code must be uppercase letters, numbers, and hyphens only"
    ),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only"
    ),
  description: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .nullable()
    .optional(),
  parentId: z.string().nullable().optional(),
  type: z.enum(categoryTypes).default("department"),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type SkillCategoryFormData = z.infer<typeof skillCategorySchema>;

export const skillCategoryFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["department", "area", "all"]).optional(),
  parentId: z.string().optional(),
  isActive: z.enum(["true", "false", "all"]).optional(),
});

export type SkillCategoryFilters = z.infer<typeof skillCategoryFilterSchema>;

// Helper to generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Helper to generate code from name
export function generateCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 10);
}
