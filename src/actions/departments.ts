"use server";

import { db } from "@/db";
import { attachments, departments, projects, roles, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types/actions";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .min(1, "Code is required")
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
  managerId: z.string().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

export async function getDepartments(params?: {
  sort?: "name" | "code" | "memberCount";
  dir?: "asc" | "desc";
}) {
  const orderBy = [];
  if (params?.sort) {
    const direction = params.dir === "asc" ? asc : desc;
    switch (params.sort) {
      case "name":
        orderBy.push(direction(departments.name));
        break;
      case "code":
        orderBy.push(direction(departments.code));
        break;
      case "memberCount":
        orderBy.push(
          direction(
            sql<number>`(SELECT COUNT(*) FROM users WHERE users.department_id = departments.id)`
          )
        );
        break;
    }
  }

  if (orderBy.length === 0) {
    orderBy.push(asc(departments.name));
  }

  const departmentsList = await db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      description: departments.description,
      managerId: departments.managerId,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
      memberCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.department_id = departments.id)`,
    })
    .from(departments)
    .orderBy(...orderBy);

  // Get manager names
  const managerIds = departmentsList
    .map((d) => d.managerId)
    .filter((id): id is string => id !== null);

  const managers =
    managerIds.length > 0
      ? await db.query.users.findMany({
          where: (users, { inArray }) => inArray(users.id, managerIds),
          columns: { id: true, name: true },
        })
      : [];

  const managerMap = new Map(managers.map((m) => [m.id, m.name]));

  return departmentsList.map((dept) => ({
    ...dept,
    managerName: dept.managerId ? managerMap.get(dept.managerId) || null : null,
  }));
}

export async function getDepartment(id: string) {
  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
    with: {
      manager: {
        columns: { id: true, name: true },
      },
    },
  });

  return department ?? null;
}

export async function createDepartment(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requirePermission(PERMISSIONS.DEPARTMENT_MANAGE);

  const rawData = {
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    managerId: formData.get("managerId") || undefined,
  };

  const parsed = createDepartmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Check for duplicate name
  const existingName = await db.query.departments.findFirst({
    where: eq(departments.name, parsed.data.name),
  });
  if (existingName) {
    return {
      success: false,
      error: "A department with this name already exists",
    };
  }

  // Check for duplicate code
  const existingCode = await db.query.departments.findFirst({
    where: eq(departments.code, parsed.data.code),
  });
  if (existingCode) {
    return {
      success: false,
      error: "A department with this code already exists",
    };
  }

  const [newDepartment] = await db
    .insert(departments)
    .values({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      managerId: parsed.data.managerId || null,
    })
    .returning({ id: departments.id });

  revalidatePath("/admin/system");

  return { success: true, data: { id: newDepartment.id } };
}

export async function updateDepartment(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.DEPARTMENT_MANAGE);

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
  });

  if (!department) {
    return { success: false, error: "Department not found" };
  }

  const rawData = {
    name: formData.get("name") || undefined,
    code: formData.get("code") || undefined,
    description: formData.get("description") || undefined,
    managerId: formData.get("managerId") || undefined,
  };

  const parsed = updateDepartmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Check for duplicate name
  if (parsed.data.name && parsed.data.name !== department.name) {
    const existing = await db.query.departments.findFirst({
      where: eq(departments.name, parsed.data.name),
    });
    if (existing) {
      return {
        success: false,
        error: "A department with this name already exists",
      };
    }
  }

  // Check for duplicate code
  if (parsed.data.code && parsed.data.code !== department.code) {
    const existing = await db.query.departments.findFirst({
      where: eq(departments.code, parsed.data.code),
    });
    if (existing) {
      return {
        success: false,
        error: "A department with this code already exists",
      };
    }
  }

  await db
    .update(departments)
    .set({
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.code && { code: parsed.data.code }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description || null,
      }),
      ...(parsed.data.managerId !== undefined && {
        managerId: parsed.data.managerId || null,
      }),
      updatedAt: new Date(),
    })
    .where(eq(departments.id, id));

  revalidatePath("/admin/system");

  return { success: true };
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.DEPARTMENT_MANAGE);

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
  });

  if (!department) {
    return { success: false, error: "Department not found" };
  }

  // Check for assigned users
  const usersInDept = await db.query.users.findFirst({
    where: eq(users.departmentId, id),
  });
  if (usersInDept) {
    return {
      success: false,
      error: "Cannot delete department: users are still assigned to it",
    };
  }

  // Check for assigned projects
  const projectsInDept = await db.query.projects.findFirst({
    where: eq(projects.departmentId, id),
  });
  if (projectsInDept) {
    return {
      success: false,
      error: "Cannot delete department: projects are associated with it",
    };
  }

  await db.delete(departments).where(eq(departments.id, id));

  revalidatePath("/admin/system");

  return { success: true };
}

// ============ PUBLIC DATA FETCHING FUNCTIONS ============
// These are accessible to all authenticated users (no permission check)

/**
 * Get all departments with stats for the public listing page
 */
export async function getDepartmentsWithStats() {
  const departmentsList = await db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      description: departments.description,
      managerId: departments.managerId,
      memberCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.department_id = departments.id)::int`,
      projectCount: sql<number>`(SELECT COUNT(*) FROM projects WHERE projects.department_id = departments.id)::int`,
    })
    .from(departments)
    .where(eq(departments.isActive, true))
    .orderBy(asc(departments.name));

  // Get manager info with avatars
  const managerIds = departmentsList
    .map((d) => d.managerId)
    .filter((id): id is string => id !== null);

  if (managerIds.length === 0) {
    return departmentsList.map((dept) => ({
      ...dept,
      managerName: null,
      managerAvatarUrl: null,
    }));
  }

  const managers = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(inArray(users.id, managerIds));

  // Get avatar URLs for managers
  const managerAvatars = await db
    .select({
      entityId: attachments.entityId,
      s3Key: attachments.s3Key,
    })
    .from(attachments)
    .where(
      and(
        eq(attachments.entityType, "user"),
        eq(attachments.type, "avatar"),
        inArray(attachments.entityId, managerIds)
      )
    );

  const managerMap = new Map(managers.map((m) => [m.id, m.name]));
  const avatarMap = new Map(
    managerAvatars.map((a) => [a.entityId, `/api/attachments/${a.s3Key}`])
  );

  return departmentsList.map((dept) => ({
    ...dept,
    managerName: dept.managerId ? managerMap.get(dept.managerId) || null : null,
    managerAvatarUrl: dept.managerId
      ? avatarMap.get(dept.managerId) || null
      : null,
  }));
}

/**
 * Get full department details with members
 */
export async function getDepartmentWithDetails(id: string) {
  // Get department base info
  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
  });

  if (!department) {
    return null;
  }

  // Get department members with roles
  const membersData = await db
    .select({
      id: users.id,
      name: users.name,
      employeeId: users.employeeId,
      email: users.email,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.departmentId, id), eq(users.isActive, true)))
    .orderBy(asc(users.name));

  // Get manager with role (if exists)
  let manager = null;
  if (department.managerId) {
    const managerData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, department.managerId))
      .limit(1);

    if (managerData.length > 0) {
      manager = managerData[0];
    }
  }

  const memberIds = membersData.map((m) => m.id);

  // Get avatars for all members
  const memberAvatars =
    memberIds.length > 0
      ? await db
          .select({
            entityId: attachments.entityId,
            s3Key: attachments.s3Key,
          })
          .from(attachments)
          .where(
            and(
              eq(attachments.entityType, "user"),
              eq(attachments.type, "avatar"),
              inArray(attachments.entityId, memberIds)
            )
          )
      : [];

  // Build lookup map for avatars
  const avatarMap = new Map(
    memberAvatars.map((a) => [a.entityId, `/api/attachments/${a.s3Key}`])
  );

  const members = membersData.map((m) => ({
    ...m,
    avatarUrl: avatarMap.get(m.id) || null,
  }));

  const memberCount = members.length;

  return {
    ...department,
    manager,
    members,
    memberCount,
  };
}
