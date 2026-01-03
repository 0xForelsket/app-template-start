import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

// ============ ENUMS ============

// Project statuses for example domain
export const projectStatuses = [
  "draft",
  "active",
  "on_hold",
  "completed",
  "cancelled",
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

// Generic entity types for attachments and audit logs
export const entityTypes = ["user", "project", "skill", "skill_category"] as const;
export type EntityType = (typeof entityTypes)[number];

// Attachment types
export const attachmentTypes = ["avatar", "photo", "document"] as const;
export type AttachmentType = (typeof attachmentTypes)[number];

// User preferences type
export interface UserPreferences {
  theme: "system" | "light" | "dark";
  density: "compact" | "comfortable";
  notifications: {
    email: boolean;
  };
}

// ============ CORE TABLES ============

export const roles = pgTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  name: text("name").unique().notNull(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().$type<string[]>().default([]),
  isSystemRole: boolean("is_system_role").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const departments = pgTable("departments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  name: text("name").unique().notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),
  managerId: text("manager_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    displayId: serial("display_id").notNull(),
    employeeId: text("employee_id").unique().notNull(),
    name: text("name").notNull(),
    email: text("email").unique(),
    pin: text("pin").notNull(),
    roleId: text("role_id").references(() => roles.id),
    departmentId: text("department_id").references(() => departments.id),
    isActive: boolean("is_active").notNull().default(true),
    preferences: jsonb("preferences").$type<UserPreferences>(),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until"),
    sessionVersion: integer("session_version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    deptRoleIdx: index("users_dept_role_idx").on(
      table.departmentId,
      table.roleId
    ),
  })
);

// ============ EXAMPLE DOMAIN: PROJECTS ============

export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    displayId: serial("display_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", { enum: projectStatuses })
      .notNull()
      .default("draft"),
    ownerId: text("owner_id").references(() => users.id),
    departmentId: text("department_id").references(() => departments.id),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("proj_status_idx").on(table.status),
    ownerIdx: index("proj_owner_idx").on(table.ownerId),
    deptIdx: index("proj_dept_idx").on(table.departmentId),
    searchIdx: index("proj_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.name} || ' ' || coalesce(${table.description}, ''))`
    ),
  })
);

// ============ LMS DOMAIN: SKILLS ============

export const skillCategories = pgTable("skill_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  displayId: serial("display_id").notNull(),
  name: text("name").unique().notNull(),
  description: text("description"),
  color: text("color"), // Hex color for UI display, e.g., "#EF4444"
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const skills = pgTable(
  "skills",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    displayId: serial("display_id").notNull(),
    name: text("name").notNull(),
    code: text("code").unique().notNull(), // Short code like "LOTO", "FORK-01"
    description: text("description"),
    categoryId: text("category_id").references(() => skillCategories.id),

    // Proficiency tracking
    hasProficiencyLevels: boolean("has_proficiency_levels")
      .notNull()
      .default(false),
    maxProficiencyLevel: integer("max_proficiency_level").notNull().default(3), // 1=Basic, 2=Intermediate, 3=Expert

    // Certification settings
    requiresCertification: boolean("requires_certification")
      .notNull()
      .default(false),
    certificationValidityMonths: integer("certification_validity_months"), // null = never expires

    // Training settings
    requiredTrainingHours: integer("required_training_hours"), // Hours required for certification
    allowOJT: boolean("allow_ojt").notNull().default(true),
    allowClassroom: boolean("allow_classroom").notNull().default(true),
    allowOnline: boolean("allow_online").notNull().default(true),

    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("skill_category_idx").on(table.categoryId),
    activeIdx: index("skill_active_idx").on(table.isActive),
    searchIdx: index("skill_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.name} || ' ' || coalesce(${table.code}, '') || ' ' || coalesce(${table.description}, ''))`
    ),
  })
);

export const skillPrerequisites = pgTable(
  "skill_prerequisites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    skillId: text("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    prerequisiteSkillId: text("prerequisite_skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    minimumProficiencyLevel: integer("minimum_proficiency_level")
      .notNull()
      .default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    skillIdx: index("prereq_skill_idx").on(table.skillId),
    prereqSkillIdx: index("prereq_prereq_skill_idx").on(
      table.prerequisiteSkillId
    ),
  })
);

// ============ INFRASTRUCTURE TABLES ============

export const attachments = pgTable("attachments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  entityType: text("entity_type", { enum: entityTypes }).notNull(),
  entityId: text("entity_id").notNull(),
  type: text("type", { enum: attachmentTypes }).notNull(),
  filename: text("filename").notNull(),
  s3Key: text("s3_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedById: text("uploaded_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedById: text("updated_by_id").references(() => users.id),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    entityType: text("entity_type", { enum: entityTypes }).notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    details: jsonb("details"),
    userId: text("user_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("audit_entity_idx").on(table.entityType, table.entityId),
    userIdx: index("audit_user_idx").on(table.userId),
  })
);

// ============ RELATIONS ============

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  manager: one(users, {
    fields: [departments.managerId],
    references: [users.id],
    relationName: "departmentManager",
  }),
  members: many(users, { relationName: "departmentMember" }),
  projects: many(projects),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  assignedRole: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
    relationName: "departmentMember",
  }),
  managedDepartment: many(departments, {
    relationName: "departmentManager",
  }),
  ownedProjects: many(projects, { relationName: "projectOwner" }),
  attachments: many(attachments),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: "projectOwner",
  }),
  department: one(departments, {
    fields: [projects.departmentId],
    references: [departments.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [attachments.uploadedById],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const skillCategoriesRelations = relations(
  skillCategories,
  ({ many }) => ({
    skills: many(skills),
  })
);

export const skillsRelations = relations(skills, ({ one, many }) => ({
  category: one(skillCategories, {
    fields: [skills.categoryId],
    references: [skillCategories.id],
  }),
  prerequisites: many(skillPrerequisites, { relationName: "skillPrereqs" }),
  prerequisiteFor: many(skillPrerequisites, { relationName: "prereqSkill" }),
}));

export const skillPrerequisitesRelations = relations(
  skillPrerequisites,
  ({ one }) => ({
    skill: one(skills, {
      fields: [skillPrerequisites.skillId],
      references: [skills.id],
      relationName: "skillPrereqs",
    }),
    prerequisiteSkill: one(skills, {
      fields: [skillPrerequisites.prerequisiteSkillId],
      references: [skills.id],
      relationName: "prereqSkill",
    }),
  })
);

// ============ TYPE EXPORTS ============

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type SkillCategory = typeof skillCategories.$inferSelect;
export type NewSkillCategory = typeof skillCategories.$inferInsert;

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

export type SkillPrerequisite = typeof skillPrerequisites.$inferSelect;
export type NewSkillPrerequisite = typeof skillPrerequisites.$inferInsert;

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromAddress: string;
  fromName: string;
}

export interface SystemSettingsConfig {
  session: {
    idleTimeout: number;
    maxDuration: number;
  };
  notifications: {
    emailEnabled: boolean;
  };
  smtp_config?: SmtpConfig;
}
