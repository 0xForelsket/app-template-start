"use server";

import { db } from "@/db";
import { type Project, projects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { projectSchema } from "@/lib/validations/projects";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProjects(filters?: {
  search?: string;
  status?: string;
  ownerId?: string;
  departmentId?: string;
}): Promise<Project[]> {
  const conditions = [];

  if (filters?.search) {
    conditions.push(ilike(projects.name, `%${filters.search}%`));
  }

  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(projects.status, filters.status as Project["status"]));
  }

  if (filters?.ownerId) {
    conditions.push(eq(projects.ownerId, filters.ownerId));
  }

  if (filters?.departmentId) {
    conditions.push(eq(projects.departmentId, filters.departmentId));
  }

  return db.query.projects.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(projects.createdAt)],
    with: {
      owner: true,
      department: true,
    },
  });
}

export async function getProject(id: string) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      owner: true,
      department: true,
    },
  });
}

export async function createProject(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.PROJECT_CREATE);

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    status: formData.get("status") || "draft",
    ownerId: formData.get("ownerId") || null,
    departmentId: formData.get("departmentId") || null,
    startDate: formData.get("startDate") || null,
    endDate: formData.get("endDate") || null,
    isActive: formData.get("isActive") === "true",
  };

  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid data",
    };
  }

  const [result] = await db
    .insert(projects)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status,
      ownerId: parsed.data.ownerId,
      departmentId: parsed.data.departmentId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      isActive: parsed.data.isActive,
    })
    .returning({ id: projects.id });

  revalidatePath("/projects");
  return { success: true, data: { id: result.id } };
}

export async function updateProject(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.PROJECT_UPDATE);

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    status: formData.get("status") || "draft",
    ownerId: formData.get("ownerId") || null,
    departmentId: formData.get("departmentId") || null,
    startDate: formData.get("startDate") || null,
    endDate: formData.get("endDate") || null,
    isActive: formData.get("isActive") === "true",
  };

  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid data",
    };
  }

  await db
    .update(projects)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status,
      ownerId: parsed.data.ownerId,
      departmentId: parsed.data.departmentId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true, data: { id } };
}

export async function deleteProject(id: string): Promise<ActionResult<void>> {
  await requirePermission(PERMISSIONS.PROJECT_DELETE);

  await db.delete(projects).where(eq(projects.id, id));

  revalidatePath("/projects");
  return { success: true };
}

export async function getProjectStats() {
  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      draft: sql<number>`sum(case when ${projects.status} = 'draft' then 1 else 0 end)`,
      active: sql<number>`sum(case when ${projects.status} = 'active' then 1 else 0 end)`,
      completed: sql<number>`sum(case when ${projects.status} = 'completed' then 1 else 0 end)`,
    })
    .from(projects)
    .where(eq(projects.isActive, true));

  return {
    total: Number(result?.total || 0),
    draft: Number(result?.draft || 0),
    active: Number(result?.active || 0),
    completed: Number(result?.completed || 0),
  };
}
