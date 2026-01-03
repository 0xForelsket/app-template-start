import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DEFAULT_ROLE_PERMISSIONS } from "../lib/permissions";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://factory:factorypassword@127.0.0.1:5433/factory";
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function hashPin(pin: string): Promise<string> {
  return Bun.password.hash(pin, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

async function seed() {
  console.log("Seeding database...\n");

  try {
    console.log("Clearing existing data...");
    await db.delete(schema.skillPrerequisites).catch(() => { });
    await db.delete(schema.skills).catch(() => { });
    await db.delete(schema.skillCategories).catch(() => { });
    await db.delete(schema.projects).catch(() => { });
    await db.delete(schema.attachments).catch(() => { });
    await db.delete(schema.auditLogs).catch(() => { });
    await db.delete(schema.users).catch(() => { });
    await db.delete(schema.departments).catch(() => { });
    await db.delete(schema.roles).catch(() => { });

    console.log("Creating roles...");
    const [employeeRole, supervisorRole, adminRole] = await db
      .insert(schema.roles)
      .values([
        {
          name: "employee",
          description: "Standard employee with basic access",
          permissions: DEFAULT_ROLE_PERMISSIONS.employee,
          isSystemRole: true,
        },
        {
          name: "supervisor",
          description: "Team supervisor with project management access",
          permissions: DEFAULT_ROLE_PERMISSIONS.supervisor,
          isSystemRole: true,
        },
        {
          name: "admin",
          description: "Administrator with full access",
          permissions: DEFAULT_ROLE_PERMISSIONS.admin,
          isSystemRole: true,
        },
      ])
      .returning();
    console.log("  Created 3 roles");

    console.log("Creating departments...");
    const [deptOps, deptEng, deptMgmt] = await db
      .insert(schema.departments)
      .values([
        {
          name: "Operations",
          code: "OPS",
          description: "Factory floor operations",
        },
        {
          name: "Engineering",
          code: "ENG",
          description: "Process engineering and improvement",
        },
        { name: "Management", code: "MGMT", description: "Plant management" },
      ])
      .returning();
    console.log("  Created 3 departments");

    console.log("Creating users...");
    const adminPin = await hashPin("123456");
    const supervisorPin = await hashPin("567890");
    const employeePin = await hashPin("000000");

    const [adminUser, supervisorUser, _employee1] = await db
      .insert(schema.users)
      .values([
        {
          employeeId: "ADMIN-001",
          name: "Admin User",
          email: "admin@factory.local",
          pin: adminPin,
          roleId: adminRole.id,
          departmentId: deptMgmt.id,
          isActive: true,
        },
        {
          employeeId: "SUP-001",
          name: "Sarah Supervisor",
          email: "sarah@factory.local",
          pin: supervisorPin,
          roleId: supervisorRole.id,
          departmentId: deptOps.id,
          isActive: true,
        },
        {
          employeeId: "EMP-001",
          name: "John Employee",
          email: "john@factory.local",
          pin: employeePin,
          roleId: employeeRole.id,
          departmentId: deptOps.id,
          isActive: true,
        },
      ])
      .returning();
    console.log("  Created 3 users");

    console.log("Creating sample projects...");
    await db.insert(schema.projects).values([
      {
        name: "Equipment Calibration Q1",
        description: "Quarterly calibration of all measurement equipment",
        status: "active",
        ownerId: supervisorUser.id,
        departmentId: deptOps.id,
        startDate: new Date(),
      },
      {
        name: "Safety Training Program",
        description: "Annual safety training for all floor staff",
        status: "draft",
        ownerId: adminUser.id,
        departmentId: deptMgmt.id,
      },
      {
        name: "Process Improvement Initiative",
        description: "Lean manufacturing implementation project",
        status: "active",
        ownerId: supervisorUser.id,
        departmentId: deptEng.id,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log("  Created 3 projects");

    console.log("Creating skill categories (departments)...");
    const [catSafety, catEquipment, catQuality, catProcess, catLeadership] =
      await db
        .insert(schema.skillCategories)
        .values([
          {
            name: "Safety",
            code: "SAFETY",
            slug: "safety",
            description: "Safety-related skills and certifications",
            color: "#EF4444",
            type: "department" as const,
            depth: 0,
            path: "safety",
            sortOrder: 1,
          },
          {
            name: "Equipment Operation",
            code: "EQUIP",
            slug: "equipment-operation",
            description: "Machine and equipment operation skills",
            color: "#3B82F6",
            type: "department" as const,
            depth: 0,
            path: "equipment-operation",
            sortOrder: 2,
          },
          {
            name: "Quality",
            code: "QC",
            slug: "quality",
            description: "Quality control and inspection skills",
            color: "#10B981",
            type: "department" as const,
            depth: 0,
            path: "quality",
            sortOrder: 3,
          },
          {
            name: "Process",
            code: "PROC",
            slug: "process",
            description: "Manufacturing process skills",
            color: "#F59E0B",
            type: "department" as const,
            depth: 0,
            path: "process",
            sortOrder: 4,
          },
          {
            name: "Leadership",
            code: "LEAD",
            slug: "leadership",
            description: "Supervisory and leadership skills",
            color: "#8B5CF6",
            type: "department" as const,
            depth: 0,
            path: "leadership",
            sortOrder: 5,
          },
        ])
        .returning();
    console.log("  Created 5 skill categories (departments)");

    console.log("Creating skills...");
    await db.insert(schema.skills).values([
      {
        name: "Lockout/Tagout (LOTO)",
        code: "LOTO",
        description:
          "Procedures for controlling hazardous energy during equipment servicing and maintenance",
        categoryId: catSafety.id,
        requiresCertification: true,
        certificationValidityMonths: 12,
        requiredTrainingHours: 4,
        allowOJT: true,
        allowClassroom: true,
        allowOnline: true,
      },
      {
        name: "Forklift Operation",
        code: "FORK",
        description: "Safe operation of powered industrial trucks (forklifts)",
        categoryId: catEquipment.id,
        requiresCertification: true,
        certificationValidityMonths: 36,
        requiredTrainingHours: 8,
        hasProficiencyLevels: true,
        maxProficiencyLevel: 3,
        allowOJT: true,
        allowClassroom: true,
        allowOnline: false,
      },
      {
        name: "First Aid/CPR",
        code: "FA-CPR",
        description: "Emergency first aid and cardiopulmonary resuscitation",
        categoryId: catSafety.id,
        requiresCertification: true,
        certificationValidityMonths: 24,
        requiredTrainingHours: 8,
        allowOJT: false,
        allowClassroom: true,
        allowOnline: false,
      },
      {
        name: "Visual Quality Inspection",
        code: "VQI",
        description: "Visual inspection techniques for quality control",
        categoryId: catQuality.id,
        requiresCertification: false,
        requiredTrainingHours: 4,
        hasProficiencyLevels: true,
        maxProficiencyLevel: 3,
        allowOJT: true,
        allowClassroom: true,
        allowOnline: true,
      },
      {
        name: "ESD Awareness",
        code: "ESD",
        description: "Electrostatic discharge prevention and handling",
        categoryId: catProcess.id,
        requiresCertification: true,
        certificationValidityMonths: 12,
        requiredTrainingHours: 2,
        allowOJT: false,
        allowClassroom: true,
        allowOnline: true,
      },
    ]);
    console.log("  Created 5 skills");

    console.log("\nSeed completed successfully!");
    console.log("\nDefault credentials:");
    console.log("  Admin:      ADMIN-001 / 123456");
    console.log("  Supervisor: SUP-001 / 567890");
    console.log("  Employee:   EMP-001 / 000000");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
