"use server";

import { db } from "@/db";
import {
  type Skill,
  type SkillCategory,
  skillPrerequisites,
  skills,
} from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import {
  generatePath,
  skillPrerequisiteSchema,
  skillSchema,
} from "@/lib/validations/skills";
import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Extended skill type with hierarchy info
export interface SkillWithHierarchy extends Skill {
  category?: SkillCategory | null;
  parentSkill?: Skill | null;
  childSkills?: SkillWithHierarchy[];
  childCount?: number;
}

export async function getSkills(filters?: {
  search?: string;
  categoryId?: string;
  parentSkillId?: string;
  isActive?: string;
  requiresCertification?: string;
  rootOnly?: string;
}): Promise<SkillWithHierarchy[]> {
  const conditions = [];

  if (filters?.search) {
    conditions.push(
      sql`to_tsvector('english', ${skills.name} || ' ' || coalesce(${skills.code}, '') || ' ' || coalesce(${skills.description}, '')) @@ plainto_tsquery('english', ${filters.search})`
    );
  }

  if (filters?.categoryId && filters.categoryId !== "all") {
    conditions.push(eq(skills.categoryId, filters.categoryId));
  }

  if (filters?.parentSkillId) {
    conditions.push(eq(skills.parentSkillId, filters.parentSkillId));
  }

  if (filters?.rootOnly === "true") {
    conditions.push(isNull(skills.parentSkillId));
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

  const result = await db.query.skills.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [asc(skills.depth), asc(skills.name)],
    with: {
      category: true,
      parentSkill: true,
    },
  });

  // Get child counts for each skill
  const countsResult = await db
    .select({
      parentId: skills.parentSkillId,
      count: sql<number>`count(*)`,
    })
    .from(skills)
    .where(sql`${skills.parentSkillId} IS NOT NULL`)
    .groupBy(skills.parentSkillId);

  const countsMap = new Map(
    countsResult.map((c) => [c.parentId, Number(c.count)])
  );

  return result.map((skill) => ({
    ...skill,
    childCount: countsMap.get(skill.id) || 0,
  }));
}

// Get skills for a specific category (for drill-down view)
export async function getSkillsByCategory(
  categoryId: string,
  rootOnly = true
): Promise<SkillWithHierarchy[]> {
  const conditions = [eq(skills.categoryId, categoryId)];

  if (rootOnly) {
    conditions.push(isNull(skills.parentSkillId));
  }

  const result = await db.query.skills.findMany({
    where: and(...conditions),
    orderBy: [asc(skills.depth), asc(skills.name)],
    with: {
      category: true,
      childSkills: {
        orderBy: [asc(skills.name)],
      },
    },
  });

  return result.map((skill) => ({
    ...skill,
    childCount: skill.childSkills?.length || 0,
  }));
}

// Get sub-skills for a parent skill
export async function getSubSkills(
  parentSkillId: string
): Promise<SkillWithHierarchy[]> {
  const result = await db.query.skills.findMany({
    where: eq(skills.parentSkillId, parentSkillId),
    orderBy: [asc(skills.name)],
    with: {
      category: true,
      childSkills: {
        orderBy: [asc(skills.name)],
      },
    },
  });

  return result.map((skill) => ({
    ...skill,
    childCount: skill.childSkills?.length || 0,
  }));
}

// Get a single skill with full context
export async function getSkill(id: string) {
  return db.query.skills.findFirst({
    where: eq(skills.id, id),
    with: {
      category: {
        with: {
          parent: true,
        },
      },
      parentSkill: true,
      childSkills: {
        orderBy: [asc(skills.name)],
      },
      prerequisites: {
        with: {
          prerequisiteSkill: true,
        },
      },
    },
  });
}

// Get skill by code
export async function getSkillByCode(code: string) {
  return db.query.skills.findFirst({
    where: eq(skills.code, code.toUpperCase()),
    with: {
      category: {
        with: {
          parent: true,
        },
      },
      parentSkill: true,
      childSkills: {
        orderBy: [asc(skills.name)],
      },
      prerequisites: {
        with: {
          prerequisiteSkill: true,
        },
      },
    },
  });
}

// Get breadcrumb trail for a skill
export async function getSkillBreadcrumbs(skillId: string): Promise<
  {
    id: string;
    name: string;
    code: string;
    type: "department" | "area" | "skill";
  }[]
> {
  const breadcrumbs: {
    id: string;
    name: string;
    code: string;
    type: "department" | "area" | "skill";
  }[] = [];

  const skill = await db.query.skills.findFirst({
    where: eq(skills.id, skillId),
    with: {
      category: {
        with: {
          parent: true,
        },
      },
      parentSkill: true,
    },
  });

  if (!skill) return breadcrumbs;

  // Add category hierarchy
  if (skill.category) {
    if (skill.category.parent) {
      breadcrumbs.push({
        id: skill.category.parent.id,
        name: skill.category.parent.name,
        code: skill.category.parent.code,
        type: "department",
      });
    }
    breadcrumbs.push({
      id: skill.category.id,
      name: skill.category.name,
      code: skill.category.code,
      type: "area",
    });
  }

  // Add parent skill hierarchy
  if (skill.parentSkillId) {
    const parentTrail: typeof breadcrumbs = [];
    let currentParent: typeof skill.parentSkill | null =
      skill.parentSkill ?? null;

    while (currentParent) {
      parentTrail.unshift({
        id: currentParent.id,
        name: currentParent.name,
        code: currentParent.code,
        type: "skill",
      });

      if (currentParent.parentSkillId) {
        const nextParent = await db.query.skills.findFirst({
          where: eq(skills.id, currentParent.parentSkillId),
        });
        currentParent = nextParent ?? null;
      } else {
        currentParent = null;
      }
    }

    breadcrumbs.push(...parentTrail);
  }

  // Add current skill
  breadcrumbs.push({
    id: skill.id,
    name: skill.name,
    code: skill.code,
    type: "skill",
  });

  return breadcrumbs;
}

// Create a new skill
export async function createSkill(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SKILL_CREATE);

  const name = formData.get("name")?.toString() || "";
  const parentSkillId = formData.get("parentSkillId")?.toString() || null;
  const categoryId = formData.get("categoryId")?.toString() || null;

  // Determine depth and path based on parent skill
  let depth = 0;
  let path = "";
  let inheritedCategoryId = categoryId;

  if (parentSkillId) {
    const parentSkill = await db.query.skills.findFirst({
      where: eq(skills.id, parentSkillId),
    });

    if (parentSkill) {
      depth = parentSkill.depth + 1;
      path = generatePath(name, parentSkill.path);
      // Inherit category from parent if not specified
      if (!categoryId && parentSkill.categoryId) {
        inheritedCategoryId = parentSkill.categoryId;
      }
    }
  } else {
    path = generatePath(name);
  }

  const raw = {
    name,
    code: formData.get("code")?.toString().toUpperCase(),
    description: formData.get("description") || null,
    categoryId: inheritedCategoryId,
    parentSkillId,
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
      parentSkillId: parsed.data.parentSkillId,
      depth,
      path,
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
  if (parentSkillId) {
    revalidatePath(`/skills/${parentSkillId}`);
  }

  return { success: true, data: { id: result.id } };
}

// Update a skill
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
    parentSkillId: formData.get("parentSkillId") || null,
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

// Delete a skill
export async function deleteSkill(id: string): Promise<ActionResult<void>> {
  await requirePermission(PERMISSIONS.SKILL_DELETE);

  // Check if skill has children
  const hasChildren = await db.query.skills.findFirst({
    where: eq(skills.parentSkillId, id),
  });

  if (hasChildren) {
    return {
      success: false,
      error: "Cannot delete skill with sub-skills. Remove sub-skills first.",
    };
  }

  // Delete prerequisites first
  await db
    .delete(skillPrerequisites)
    .where(
      sql`${skillPrerequisites.skillId} = ${id} OR ${skillPrerequisites.prerequisiteSkillId} = ${id}`
    );

  await db.delete(skills).where(eq(skills.id, id));

  revalidatePath("/skills");
  return { success: true };
}

// Get skill statistics
export async function getSkillStats() {
  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`sum(case when ${skills.isActive} = true then 1 else 0 end)`,
      requiresCertification: sql<number>`sum(case when ${skills.requiresCertification} = true then 1 else 0 end)`,
      rootSkills: sql<number>`sum(case when ${skills.parentSkillId} IS NULL then 1 else 0 end)`,
      subSkills: sql<number>`sum(case when ${skills.parentSkillId} IS NOT NULL then 1 else 0 end)`,
    })
    .from(skills);

  return {
    total: Number(result?.total || 0),
    active: Number(result?.active || 0),
    requiresCertification: Number(result?.requiresCertification || 0),
    rootSkills: Number(result?.rootSkills || 0),
    subSkills: Number(result?.subSkills || 0),
  };
}

// Get full skill tree for tree view
export async function getSkillTree(
  categoryId?: string
): Promise<SkillWithHierarchy[]> {
  const conditions = [];

  if (categoryId) {
    conditions.push(eq(skills.categoryId, categoryId));
  }

  const allSkills = await db.query.skills.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [asc(skills.depth), asc(skills.name)],
    with: {
      category: true,
    },
  });

  // Build tree structure
  const skillMap = new Map<string, SkillWithHierarchy>();
  const roots: SkillWithHierarchy[] = [];

  // First pass: create all nodes
  for (const skill of allSkills) {
    skillMap.set(skill.id, {
      ...skill,
      childSkills: [],
      childCount: 0,
    });
  }

  // Second pass: link parents and children
  for (const skill of allSkills) {
    const node = skillMap.get(skill.id)!;
    if (skill.parentSkillId && skillMap.has(skill.parentSkillId)) {
      const parent = skillMap.get(skill.parentSkillId)!;
      parent.childSkills = parent.childSkills || [];
      parent.childSkills.push(node);
      parent.childCount = parent.childSkills.length;
    } else {
      roots.push(node);
    }
  }

  return roots;
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
      eq(
        skillPrerequisites.prerequisiteSkillId,
        parsed.data.prerequisiteSkillId
      )
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
