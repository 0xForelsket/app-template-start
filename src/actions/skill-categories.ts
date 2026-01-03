"use server";

import { db } from "@/db";
import { type SkillCategory, skillCategories, skills } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { skillCategorySchema } from "@/lib/validations/skill-categories";
import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSkillCategories(filters?: {
  search?: string;
  isActive?: string;
}): Promise<SkillCategory[]> {
  const conditions = [];

  if (filters?.search) {
    conditions.push(ilike(skillCategories.name, `%${filters.search}%`));
  }

  if (filters?.isActive && filters.isActive !== "all") {
    conditions.push(eq(skillCategories.isActive, filters.isActive === "true"));
  }

  return db.query.skillCategories.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [asc(skillCategories.sortOrder), asc(skillCategories.name)],
  });
}

export async function getSkillCategory(id: string) {
  return db.query.skillCategories.findFirst({
    where: eq(skillCategories.id, id),
    with: {
      skills: {
        where: eq(skills.isActive, true),
        orderBy: [asc(skills.name)],
      },
    },
  });
}

export async function createSkillCategory(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SKILL_CATEGORY_MANAGE);

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    color: formData.get("color") || null,
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "true",
  };

  const parsed = skillCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid data",
    };
  }

  const [result] = await db
    .insert(skillCategories)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      color: parsed.data.color,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    })
    .returning({ id: skillCategories.id });

  revalidatePath("/skills/categories");
  revalidatePath("/skills");
  return { success: true, data: { id: result.id } };
}

export async function updateSkillCategory(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SKILL_CATEGORY_MANAGE);

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    color: formData.get("color") || null,
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "true",
  };

  const parsed = skillCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid data",
    };
  }

  await db
    .update(skillCategories)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      color: parsed.data.color,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(skillCategories.id, id));

  revalidatePath("/skills/categories");
  revalidatePath(`/skills/categories/${id}`);
  revalidatePath("/skills");
  return { success: true, data: { id } };
}

export async function deleteSkillCategory(
  id: string
): Promise<ActionResult<void>> {
  await requirePermission(PERMISSIONS.SKILL_CATEGORY_MANAGE);

  // Check if category has skills
  const categoryWithSkills = await db.query.skillCategories.findFirst({
    where: eq(skillCategories.id, id),
    with: { skills: { limit: 1 } },
  });

  if (categoryWithSkills?.skills?.length) {
    return {
      success: false,
      error:
        "Cannot delete category with assigned skills. Remove or reassign skills first.",
    };
  }

  await db.delete(skillCategories).where(eq(skillCategories.id, id));

  revalidatePath("/skills/categories");
  revalidatePath("/skills");
  return { success: true };
}

export async function getSkillCategoryStats() {
  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`sum(case when ${skillCategories.isActive} = true then 1 else 0 end)`,
    })
    .from(skillCategories);

  return {
    total: Number(result?.total || 0),
    active: Number(result?.active || 0),
  };
}
