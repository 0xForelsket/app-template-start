import { z } from "zod";

export const skillSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20)
    .regex(
      /^[A-Z0-9-]+$/,
      "Code must be uppercase letters, numbers, and hyphens only"
    ),
  description: z.string().max(2000).nullable().optional(),
  categoryId: z.string().nullable().optional(),

  // Proficiency settings
  hasProficiencyLevels: z.boolean().default(false),
  maxProficiencyLevel: z.coerce.number().int().min(1).max(10).default(3),

  // Certification settings
  requiresCertification: z.boolean().default(false),
  certificationValidityMonths: z.coerce
    .number()
    .int()
    .min(1)
    .max(120)
    .nullable()
    .optional(),

  // Training settings
  requiredTrainingHours: z.coerce
    .number()
    .min(0)
    .max(1000)
    .nullable()
    .optional(),
  allowOJT: z.boolean().default(true),
  allowClassroom: z.boolean().default(true),
  allowOnline: z.boolean().default(true),

  isActive: z.boolean().default(true),
});

export type SkillFormData = z.infer<typeof skillSchema>;

export const skillFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.enum(["true", "false", "all"]).optional(),
  requiresCertification: z.enum(["true", "false", "all"]).optional(),
});

export type SkillFilters = z.infer<typeof skillFilterSchema>;

export const skillPrerequisiteSchema = z.object({
  skillId: z.string().min(1, "Skill is required"),
  prerequisiteSkillId: z.string().min(1, "Prerequisite skill is required"),
  minimumProficiencyLevel: z.coerce.number().int().min(1).max(10).default(1),
});

export type SkillPrerequisiteFormData = z.infer<typeof skillPrerequisiteSchema>;
