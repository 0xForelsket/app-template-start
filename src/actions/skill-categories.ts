"use server";

import { db } from "@/db";
import {
  type CategoryType,
  type SkillCategory,
  skillCategories,
  skills,
} from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import {
  generateSlug,
  skillCategorySchema,
} from "@/lib/validations/skill-categories";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Extended type with hierarchy info
export interface SkillCategoryWithHierarchy extends SkillCategory {
  parent?: SkillCategory | null;
  children?: SkillCategoryWithHierarchy[];
  skillCount?: number;
  childCount?: number;
}

// Get all departments (top-level categories)
export async function getDepartments(): Promise<SkillCategoryWithHierarchy[]> {
  const departments = await db.query.skillCategories.findMany({
    where: and(
      eq(skillCategories.type, "department"),
      isNull(skillCategories.parentId)
    ),
    orderBy: [asc(skillCategories.sortOrder), asc(skillCategories.name)],
    with: {
      children: {
        where: eq(skillCategories.type, "area"),
        orderBy: [asc(skillCategories.sortOrder), asc(skillCategories.name)],
      },
    },
  });

  // Get counts for each department
  const countsResult = await db
    .select({
      departmentId: skillCategories.id,
      areaCount: sql<number>`(
        SELECT COUNT(*) FROM skill_categories sc
        WHERE sc.parent_id = skill_categories.id
        AND sc.type = 'area'
      )`,
      skillCount: sql<number>`(
        SELECT COUNT(*) FROM skills s
        INNER JOIN skill_categories sc ON s.category_id = sc.id
        WHERE sc.parent_id = skill_categories.id OR s.category_id = skill_categories.id
      )`,
    })
    .from(skillCategories)
    .where(eq(skillCategories.type, "department"));

  const countsMap = new Map(
    countsResult.map((c) => [
      c.departmentId,
      { areaCount: c.areaCount, skillCount: c.skillCount },
    ])
  );

  return departments.map((dept) => ({
    ...dept,
    childCount: countsMap.get(dept.id)?.areaCount || 0,
    skillCount: countsMap.get(dept.id)?.skillCount || 0,
  }));
}

// Get areas for a department
export async function getAreas(
  departmentId: string
): Promise<SkillCategoryWithHierarchy[]> {
  const areas = await db.query.skillCategories.findMany({
    where: and(
      eq(skillCategories.type, "area"),
      eq(skillCategories.parentId, departmentId)
    ),
    orderBy: [asc(skillCategories.sortOrder), asc(skillCategories.name)],
    with: {
      parent: true,
    },
  });

  // Get skill counts for each area (skip if no areas to avoid IN () SQL error)
  if (areas.length === 0) {
    return [];
  }

  const countsResult = await db
    .select({
      areaId: skills.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(skills)
    .where(
      sql`${skills.categoryId} IN (${sql.join(
        areas.map((a) => sql`${a.id}`),
        sql`, `
      )})`
    )
    .groupBy(skills.categoryId);

  const countsMap = new Map(countsResult.map((c) => [c.areaId, c.count]));

  return areas.map((area) => ({
    ...area,
    skillCount: countsMap.get(area.id) || 0,
  }));
}

// Get all skill categories with optional filters
export async function getSkillCategories(filters?: {
  search?: string;
  type?: string;
  parentId?: string;
  isActive?: string;
}): Promise<SkillCategory[]> {
  const conditions = [];

  if (filters?.search) {
    conditions.push(
      sql`(${skillCategories.name} ILIKE ${`%${filters.search}%`} OR ${skillCategories.code} ILIKE ${`%${filters.search}%`})`
    );
  }

  if (filters?.type && filters.type !== "all") {
    conditions.push(eq(skillCategories.type, filters.type as CategoryType));
  }

  if (filters?.parentId) {
    conditions.push(eq(skillCategories.parentId, filters.parentId));
  }

  if (filters?.isActive && filters.isActive !== "all") {
    conditions.push(eq(skillCategories.isActive, filters.isActive === "true"));
  }

  return db.query.skillCategories.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [
      asc(skillCategories.depth),
      asc(skillCategories.sortOrder),
      asc(skillCategories.name),
    ],
    with: {
      parent: true,
    },
  });
}

// Get a single category by ID with full hierarchy context
export async function getSkillCategory(id: string) {
  const category = await db.query.skillCategories.findFirst({
    where: eq(skillCategories.id, id),
    with: {
      parent: true,
      children: {
        orderBy: [asc(skillCategories.sortOrder), asc(skillCategories.name)],
      },
      skills: {
        where: eq(skills.isActive, true),
        orderBy: [asc(skills.name)],
      },
    },
  });

  return category;
}

// Get a category by slug for URL-based navigation
export async function getSkillCategoryBySlug(slug: string) {
  return db.query.skillCategories.findFirst({
    where: eq(skillCategories.slug, slug),
    with: {
      parent: true,
      children: {
        orderBy: [asc(skillCategories.sortOrder), asc(skillCategories.name)],
      },
      skills: {
        where: eq(skills.isActive, true),
        orderBy: [asc(skills.name)],
      },
    },
  });
}

// Get breadcrumb trail for a category
export async function getCategoryBreadcrumbs(
  categoryId: string
): Promise<{ id: string; name: string; slug: string; type: CategoryType }[]> {
  const breadcrumbs: {
    id: string;
    name: string;
    slug: string;
    type: CategoryType;
  }[] = [];

  let currentId: string | null = categoryId;

  while (currentId) {
    const [foundCategory] = await db
      .select({
        id: skillCategories.id,
        name: skillCategories.name,
        slug: skillCategories.slug,
        type: skillCategories.type,
        parentId: skillCategories.parentId,
      })
      .from(skillCategories)
      .where(eq(skillCategories.id, currentId))
      .limit(1);

    if (!foundCategory) break;

    breadcrumbs.unshift({
      id: foundCategory.id,
      name: foundCategory.name,
      slug: foundCategory.slug,
      type: foundCategory.type,
    });

    currentId = foundCategory.parentId;
  }

  return breadcrumbs;
}

// Create a new skill category
export async function createSkillCategory(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SKILL_CATEGORY_MANAGE);

  const name = formData.get("name")?.toString() || "";
  const parentId = formData.get("parentId")?.toString() || null;

  // Generate slug if not provided
  let slug = formData.get("slug")?.toString();
  if (!slug) {
    slug = generateSlug(name);
  }

  // Generate code if not provided
  let code = formData.get("code")?.toString()?.toUpperCase();
  if (!code) {
    code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 10);
  }

  // Determine type and depth based on parent
  let type: CategoryType = "department";
  let depth = 0;
  let path = slug;

  if (parentId) {
    const parent = await db.query.skillCategories.findFirst({
      where: eq(skillCategories.id, parentId),
    });

    if (parent) {
      type = "area";
      depth = parent.depth + 1;
      path = parent.path ? `${parent.path}/${slug}` : slug;
    }
  }

  const raw = {
    name,
    code,
    slug,
    description: formData.get("description") || null,
    color: formData.get("color") || null,
    parentId,
    type,
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

  // Check for duplicate code
  const existingCode = await db.query.skillCategories.findFirst({
    where: eq(skillCategories.code, code),
  });
  if (existingCode) {
    return {
      success: false,
      error: "A category with this code already exists",
    };
  }

  const [result] = await db
    .insert(skillCategories)
    .values({
      name: parsed.data.name,
      code: parsed.data.code,
      slug: parsed.data.slug,
      description: parsed.data.description,
      color: parsed.data.color,
      parentId: parsed.data.parentId,
      type,
      depth,
      path,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    })
    .returning({ id: skillCategories.id });

  revalidatePath("/skills");
  revalidatePath("/skills/categories");
  if (parentId) {
    revalidatePath(`/skills/categories/${parentId}`);
  }

  return { success: true, data: { id: result.id } };
}

// Update a skill category
export async function updateSkillCategory(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.SKILL_CATEGORY_MANAGE);

  const existing = await db.query.skillCategories.findFirst({
    where: eq(skillCategories.id, id),
  });

  if (!existing) {
    return { success: false, error: "Category not found" };
  }

  const raw = {
    name: formData.get("name"),
    code: formData.get("code")?.toString().toUpperCase(),
    slug: formData.get("slug"),
    description: formData.get("description") || null,
    color: formData.get("color") || null,
    parentId: formData.get("parentId") || null,
    type: existing.type, // Don't allow type change
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

  // Check for duplicate code (excluding self)
  const existingCode = await db.query.skillCategories.findFirst({
    where: and(
      eq(skillCategories.code, parsed.data.code),
      sql`${skillCategories.id} != ${id}`
    ),
  });
  if (existingCode) {
    return {
      success: false,
      error: "A category with this code already exists",
    };
  }

  await db
    .update(skillCategories)
    .set({
      name: parsed.data.name,
      code: parsed.data.code,
      slug: parsed.data.slug,
      description: parsed.data.description,
      color: parsed.data.color,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(skillCategories.id, id));

  revalidatePath("/skills");
  revalidatePath("/skills/categories");
  revalidatePath(`/skills/categories/${id}`);

  return { success: true, data: { id } };
}

// Delete a skill category
export async function deleteSkillCategory(
  id: string
): Promise<ActionResult<void>> {
  await requirePermission(PERMISSIONS.SKILL_CATEGORY_MANAGE);

  // Check if category has children
  const hasChildren = await db.query.skillCategories.findFirst({
    where: eq(skillCategories.parentId, id),
  });

  if (hasChildren) {
    return {
      success: false,
      error:
        "Cannot delete category with sub-categories. Remove children first.",
    };
  }

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

  revalidatePath("/skills");
  revalidatePath("/skills/categories");

  return { success: true };
}

// Get hierarchy stats
export async function getSkillCategoryStats() {
  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      departments: sql<number>`sum(case when ${skillCategories.type} = 'department' then 1 else 0 end)`,
      areas: sql<number>`sum(case when ${skillCategories.type} = 'area' then 1 else 0 end)`,
      active: sql<number>`sum(case when ${skillCategories.isActive} = true then 1 else 0 end)`,
    })
    .from(skillCategories);

  return {
    total: Number(result?.total || 0),
    departments: Number(result?.departments || 0),
    areas: Number(result?.areas || 0),
    active: Number(result?.active || 0),
  };
}

// Get the full hierarchy tree (for tree view)
export async function getFullCategoryTree(): Promise<
  SkillCategoryWithHierarchy[]
> {
  const allCategories = await db.query.skillCategories.findMany({
    orderBy: [
      asc(skillCategories.depth),
      asc(skillCategories.sortOrder),
      asc(skillCategories.name),
    ],
    with: {
      skills: {
        columns: { id: true },
      },
    },
  });

  // Build tree structure
  const categoryMap = new Map<string, SkillCategoryWithHierarchy>();
  const roots: SkillCategoryWithHierarchy[] = [];

  // First pass: create all nodes
  for (const cat of allCategories) {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
      skillCount: cat.skills?.length || 0,
    });
  }

  // Second pass: link parents and children
  for (const cat of allCategories) {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      const parent = categoryMap.get(cat.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
