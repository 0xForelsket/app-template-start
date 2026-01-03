"use server";

import { db } from "@/db";
import { type Skill, skillPrerequisites, skills } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import {
  skillPrerequisiteSchema,
  skillSchema,
} from "@/lib/validations/skills";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSkills(filters?: {
  search?: string;
  categoryId?: string;
  isActive?: string;
  requiresCertification?: string;
}): Promise<Skill[]> {
  const conditions = [];

  if (filters?.search) {
    conditions.push(
      sql`to_tsvector('english', ${skills.name} || ' ' || coalesce(${skills.code}, '') || ' ' || coalesce(${skills.description}, '')) @@ plainto_tsquery('english', ${filters.search})`
    );
  }

  if (filters?.categoryId && filters.categoryId !== "all") {
    conditions.push(eq(skills.categoryId, filters.categoryId));
  }

  if (filters?.isActive && filters.isActive !== "all") {
    conditions.push(eq(skills.isActive, filters.isActive === "true"));
  }

  if (
    filters?.requiresCertification &&
    filters.requiresCertification !== "all"
  ) {
    conditions.push(
      eq(skills.requiresCertification, filters.requiresCertification === "true")
    );
  }

  return db.query.skills.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [asc(skills.name)],
    with: {
      category: true,
    },
  });
}

export async function getSkill(id: string) {
  return db.query.skills.findFirst({
    where: eq(skills.id, id),
    with: {
      category: true,
      prerequisites: {
        with: {
          prerequisiteSkill: true,
        },
      },
    },
  });
}

export async function createSkill(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SKILL_CREATE);

  const raw = {
    name: formData.get("name"),
    code: formData.get("code")?.toString().toUpperCase(),
    description: formData.get("description") || null,
    categoryId: formData.get("categoryId") || null,
    hasProficiencyLevels: formData.get("hasProficiencyLevels") === "true",
    maxProficiencyLevel: formData.get("maxProficiencyLevel") || 3,
    requiresCertification: formData.get("requiresCertification") === "true",
    certificationValidityMonths:
      formData.get("certificationValidityMonths") || null,
    requiredTrainingHours: formData.get("requiredTrainingHours") || null,
    allowOJT: formData.get("allowOJT") !== "false", // Default true
    allowClassroom: formData.get("allowClassroom") !== "false",
    allowOnline: formData.get("allowOnline") !== "false",
    isActive: formData.get("isActive") === "true",
  };

  const parsed = skillSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid data",
    };
  }

  // Check for duplicate code
  const existing = await db.query.skills.findFirst({
    where: eq(skills.code, parsed.data.code),
  });
  if (existing) {
    return { success: false, error: "A skill with this code already exists" };
  }

  const [result] = await db
    .insert(skills)
    .values({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      hasProficiencyLevels: parsed.data.hasProficiencyLevels,
      maxProficiencyLevel: parsed.data.maxProficiencyLevel,
      requiresCertification: parsed.data.requiresCertification,
      certificationValidityMonths: parsed.data.certificationValidityMonths,
      requiredTrainingHours: parsed.data.requiredTrainingHours,
      allowOJT: parsed.data.allowOJT,
      allowClassroom: parsed.data.allowClassroom,
      allowOnline: parsed.data.allowOnline,
      isActive: parsed.data.isActive,
    })
    .returning({ id: skills.id });

  revalidatePath("/skills");
  return { success: true, data: { id: result.id } };
}

export async function updateSkill(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SKILL_UPDATE);

  const raw = {
    name: formData.get("name"),
    code: formData.get("code")?.toString().toUpperCase(),
    description: formData.get("description") || null,
    categoryId: formData.get("categoryId") || null,
    hasProficiencyLevels: formData.get("hasProficiencyLevels") === "true",
    maxProficiencyLevel: formData.get("maxProficiencyLevel") || 3,
    requiresCertification: formData.get("requiresCertification") === "true",
    certificationValidityMonths:
      formData.get("certificationValidityMonths") || null,
    requiredTrainingHours: formData.get("requiredTrainingHours") || null,
    allowOJT: formData.get("allowOJT") !== "false",
    allowClassroom: formData.get("allowClassroom") !== "false",
    allowOnline: formData.get("allowOnline") !== "false",
    isActive: formData.get("isActive") === "true",
  };

  const parsed = skillSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid data",
    };
  }

  // Check for duplicate code (excluding current skill)
  const existing = await db.query.skills.findFirst({
    where: and(eq(skills.code, parsed.data.code), ne(skills.id, id)),
  });
  if (existing) {
    return { success: false, error: "A skill with this code already exists" };
  }

  await db
    .update(skills)
    .set({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      hasProficiencyLevels: parsed.data.hasProficiencyLevels,
      maxProficiencyLevel: parsed.data.maxProficiencyLevel,
      requiresCertification: parsed.data.requiresCertification,
      certificationValidityMonths: parsed.data.certificationValidityMonths,
      requiredTrainingHours: parsed.data.requiredTrainingHours,
      allowOJT: parsed.data.allowOJT,
      allowClassroom: parsed.data.allowClassroom,
      allowOnline: parsed.data.allowOnline,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(skills.id, id));

  revalidatePath("/skills");
  revalidatePath(`/skills/${id}`);
  return { success: true, data: { id } };
}

export async function deleteSkill(id: string): Promise<ActionResult<void>> {
  await requirePermission(PERMISSIONS.SKILL_DELETE);

  // Delete prerequisites first (cascade should handle this, but explicit is safer)
  await db
    .delete(skillPrerequisites)
    .where(
      sql`${skillPrerequisites.skillId} = ${id} OR ${skillPrerequisites.prerequisiteSkillId} = ${id}`
    );

  await db.delete(skills).where(eq(skills.id, id));

  revalidatePath("/skills");
  return { success: true };
}

export async function getSkillStats() {
  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`sum(case when ${skills.isActive} = true then 1 else 0 end)`,
      requiresCertification: sql<number>`sum(case when ${skills.requiresCertification} = true then 1 else 0 end)`,
    })
    .from(skills);

  return {
    total: Number(result?.total || 0),
    active: Number(result?.active || 0),
    requiresCertification: Number(result?.requiresCertification || 0),
  };
}

// Prerequisite management
export async function addSkillPrerequisite(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SKILL_UPDATE);

  const raw = {
    skillId: formData.get("skillId"),
    prerequisiteSkillId: formData.get("prerequisiteSkillId"),
    minimumProficiencyLevel: formData.get("minimumProficiencyLevel") || 1,
  };

  const parsed = skillPrerequisiteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid data",
    };
  }

  // Prevent self-reference
  if (parsed.data.skillId === parsed.data.prerequisiteSkillId) {
    return { success: false, error: "A skill cannot be its own prerequisite" };
  }

  // Check for existing prerequisite
  const existing = await db.query.skillPrerequisites.findFirst({
    where: and(
      eq(skillPrerequisites.skillId, parsed.data.skillId),
      eq(skillPrerequisites.prerequisiteSkillId, parsed.data.prerequisiteSkillId)
    ),
  });
  if (existing) {
    return { success: false, error: "This prerequisite already exists" };
  }

  const [result] = await db
    .insert(skillPrerequisites)
    .values({
      skillId: parsed.data.skillId,
      prerequisiteSkillId: parsed.data.prerequisiteSkillId,
      minimumProficiencyLevel: parsed.data.minimumProficiencyLevel,
    })
    .returning({ id: skillPrerequisites.id });

  revalidatePath(`/skills/${parsed.data.skillId}`);
  return { success: true, data: { id: result.id } };
}

export async function removeSkillPrerequisite(
  id: string
): Promise<ActionResult<void>> {
  await requirePermission(PERMISSIONS.SKILL_UPDATE);

  const prereq = await db.query.skillPrerequisites.findFirst({
    where: eq(skillPrerequisites.id, id),
  });

  await db.delete(skillPrerequisites).where(eq(skillPrerequisites.id, id));

  if (prereq) {
    revalidatePath(`/skills/${prereq.skillId}`);
  }
  return { success: true };
}
