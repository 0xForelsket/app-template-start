import { projectStatuses } from "@/db/schema";
import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(projectStatuses).default("draft"),
  ownerId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const projectFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum([...projectStatuses, "all"]).optional(),
  ownerId: z.string().optional(),
  departmentId: z.string().optional(),
});

export type ProjectFilters = z.infer<typeof projectFilterSchema>;
