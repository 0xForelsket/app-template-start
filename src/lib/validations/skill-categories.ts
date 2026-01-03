import { z } from "zod";

export const skillCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .nullable()
    .optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type SkillCategoryFormData = z.infer<typeof skillCategorySchema>;

export const skillCategoryFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(["true", "false", "all"]).optional(),
});

export type SkillCategoryFilters = z.infer<typeof skillCategoryFilterSchema>;
