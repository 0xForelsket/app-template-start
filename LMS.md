# LMS - Learning Management System

A focused training and certification tracking app for manufacturing environments.

---

## Overview

**Purpose:** Track employee skills, certifications, and training records. Ensure compliance with safety and regulatory requirements. Identify training gaps.

**Users:**
- **Employees** - View their own training records and upcoming requirements
- **Supervisors** - View team training status, assign training
- **Trainers** - Log training sessions, certify employees
- **Admins** - Manage skills, requirements, configure system

---

## Core Concepts

### Skills
A capability or competency an employee can have. Examples:
- Forklift Operation
- Lockout/Tagout (LOTO)
- First Aid/CPR
- Machine Setup - Press Line 1
- Quality Inspection - Visual

### Skill Categories
Groupings for organization:
- Safety
- Equipment Operation
- Quality
- Process
- Leadership

### Certifications
Formal credentials with expiration dates. A certification proves proficiency in a skill.
- May require renewal (annual, biennial, etc.)
- May require specific training to obtain
- Some are external (OSHA, forklift license), some internal

### Training Events
Actual training sessions that occurred:
- Classroom sessions
- On-the-job training (OJT)
- Online courses
- External training

### Training Requirements
Rules defining who needs what training:
- By role: "All operators must have LOTO training"
- By department: "Assembly dept needs ESD training"
- For certification: "Forklift cert requires 8hr training + practical"

---

## Database Schema

```typescript
// src/db/schema.ts

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================
// CORE TABLES (from template)
// ============================================

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions", { mode: "json" }).$type<string[]>().default([]),
  isSystemRole: integer("is_system_role", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const departments = sqliteTable("departments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").unique(),
  managerId: integer("manager_id").references(() => users.id),
  parentId: integer("parent_id").references(() => departments.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  pinHash: text("pin_hash").notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  jobTitle: text("job_title"),
  hireDate: integer("hire_date", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  avatarUrl: text("avatar_url"),
  preferences: text("preferences", { mode: "json" }).$type<UserPreferences>(),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
  sessionVersion: integer("session_version").default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN, etc.
  entityType: text("entity_type").notNull(), // skill, certification, training, etc.
  entityId: integer("entity_id"),
  details: text("details", { mode: "json" }),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const systemSettings = sqliteTable("system_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value", { mode: "json" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ============================================
// LMS DOMAIN TABLES
// ============================================

// ---------- SKILLS ----------

export const skillCategories = sqliteTable("skill_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"), // For UI display (hex color)
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").unique(), // Short code like "LOTO", "FORK-01"
  description: text("description"),
  categoryId: integer("category_id").references(() => skillCategories.id),

  // Proficiency tracking
  hasProficiencyLevels: integer("has_proficiency_levels", { mode: "boolean" }).default(false),
  maxProficiencyLevel: integer("max_proficiency_level").default(3), // e.g., 1=Basic, 2=Intermediate, 3=Expert

  // Certification settings
  requiresCertification: integer("requires_certification", { mode: "boolean" }).default(false),
  certificationValidityMonths: integer("certification_validity_months"), // null = never expires

  // Training settings
  requiredTrainingHours: real("required_training_hours"),
  allowOJT: integer("allow_ojt", { mode: "boolean" }).default(true),
  allowClassroom: integer("allow_classroom", { mode: "boolean" }).default(true),
  allowOnline: integer("allow_online", { mode: "boolean" }).default(true),

  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Prerequisites: Skill A requires Skill B first
export const skillPrerequisites = sqliteTable("skill_prerequisites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id").references(() => skills.id).notNull(),
  prerequisiteSkillId: integer("prerequisite_skill_id").references(() => skills.id).notNull(),
  minimumProficiencyLevel: integer("minimum_proficiency_level").default(1),
});

// ---------- EMPLOYEE SKILLS ----------

export const employeeSkills = sqliteTable("employee_skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  skillId: integer("skill_id").references(() => skills.id).notNull(),

  // Current status
  proficiencyLevel: integer("proficiency_level").default(1),
  status: text("status", {
    enum: ["learning", "certified", "expired", "revoked"]
  }).default("learning"),

  // Certification tracking
  certifiedAt: integer("certified_at", { mode: "timestamp" }),
  certifiedById: integer("certified_by_id").references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }),

  // Training progress
  trainingHoursCompleted: real("training_hours_completed").default(0),

  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ---------- TRAINING ----------

export const trainingTypes = sqliteTable("training_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // Classroom, OJT, Online, External, etc.
  code: text("code").unique(),
  description: text("description"),
  requiresInstructor: integer("requires_instructor", { mode: "boolean" }).default(true),
  requiresSignature: integer("requires_signature", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const trainingSessions = sqliteTable("training_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),

  // What skill(s) does this train?
  skillId: integer("skill_id").references(() => skills.id),

  // Session details
  trainingTypeId: integer("training_type_id").references(() => trainingTypes.id).notNull(),
  instructorId: integer("instructor_id").references(() => users.id),
  externalInstructor: text("external_instructor"), // For external trainers

  // Schedule
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }),
  scheduledEndDate: integer("scheduled_end_date", { mode: "timestamp" }),
  durationHours: real("duration_hours"),
  location: text("location"),

  // Capacity
  maxAttendees: integer("max_attendees"),

  // Status
  status: text("status", {
    enum: ["scheduled", "in_progress", "completed", "cancelled"]
  }).default("scheduled"),

  // Completion
  completedAt: integer("completed_at", { mode: "timestamp" }),

  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Training attendees / records
export const trainingRecords = sqliteTable("training_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => trainingSessions.id),
  skillId: integer("skill_id").references(() => skills.id).notNull(),

  // For ad-hoc training without a session
  trainingTypeId: integer("training_type_id").references(() => trainingTypes.id),
  trainerId: integer("trainer_id").references(() => users.id),

  // Record details
  trainingDate: integer("training_date", { mode: "timestamp" }).notNull(),
  hoursCompleted: real("hours_completed").notNull(),

  // Assessment
  status: text("status", {
    enum: ["attended", "passed", "failed", "incomplete"]
  }).default("attended"),
  score: real("score"), // Percentage if there was a test

  // Verification
  verifiedById: integer("verified_by_id").references(() => users.id),
  verifiedAt: integer("verified_at", { mode: "timestamp" }),

  // Signatures (if required)
  traineeSignature: text("trainee_signature"), // Base64 or URL
  trainerSignature: text("trainer_signature"),

  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ---------- TRAINING REQUIREMENTS ----------

export const trainingRequirements = sqliteTable("training_requirements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),

  skillId: integer("skill_id").references(() => skills.id).notNull(),

  // Who does this apply to?
  appliesToAllUsers: integer("applies_to_all_users", { mode: "boolean" }).default(false),
  roleId: integer("role_id").references(() => roles.id), // Applies to specific role
  departmentId: integer("department_id").references(() => departments.id), // Applies to department

  // Timing
  requiredWithinDays: integer("required_within_days"), // Days from hire date
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  recurringMonths: integer("recurring_months"), // Refresh every N months

  // Priority
  priority: text("priority", {
    enum: ["critical", "high", "medium", "low"]
  }).default("medium"),
  isMandatory: integer("is_mandatory", { mode: "boolean" }).default(true),

  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ---------- TRAINING MATERIALS ----------

export const trainingMaterials = sqliteTable("training_materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id").references(() => skills.id).notNull(),

  title: text("title").notNull(),
  description: text("description"),
  type: text("type", {
    enum: ["document", "video", "link", "quiz"]
  }).notNull(),

  // Content
  url: text("url"), // For links/videos
  fileUrl: text("file_url"), // For uploaded documents
  fileName: text("file_name"),
  fileSizeBytes: integer("file_size_bytes"),

  // Ordering
  sortOrder: integer("sort_order").default(0),
  isRequired: integer("is_required", { mode: "boolean" }).default(false),

  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ---------- NOTIFICATIONS ----------

export const trainingNotifications = sqliteTable("training_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),

  type: text("type", {
    enum: [
      "certification_expiring",
      "certification_expired",
      "training_assigned",
      "training_reminder",
      "training_completed",
      "requirement_due"
    ]
  }).notNull(),

  title: text("title").notNull(),
  message: text("message"),

  // Related entities
  skillId: integer("skill_id").references(() => skills.id),
  sessionId: integer("session_id").references(() => trainingSessions.id),

  isRead: integer("is_read", { mode: "boolean" }).default(false),
  readAt: integer("read_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ---------- TYPES ----------

export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  emailNotifications?: boolean;
  density?: "compact" | "normal" | "comfortable";
}
```

---

## Permissions

```typescript
// src/lib/permissions.ts

export const PERMISSIONS = {
  // Skills
  SKILL_VIEW: "skill:view",
  SKILL_CREATE: "skill:create",
  SKILL_UPDATE: "skill:update",
  SKILL_DELETE: "skill:delete",

  // Training Sessions
  TRAINING_VIEW: "training:view",
  TRAINING_VIEW_ALL: "training:view_all", // See all sessions, not just own
  TRAINING_CREATE: "training:create",
  TRAINING_UPDATE: "training:update",
  TRAINING_DELETE: "training:delete",
  TRAINING_CONDUCT: "training:conduct", // Can be instructor

  // Employee Skills / Certifications
  CERTIFICATION_VIEW: "certification:view",
  CERTIFICATION_VIEW_ALL: "certification:view_all",
  CERTIFICATION_GRANT: "certification:grant", // Can certify others
  CERTIFICATION_REVOKE: "certification:revoke",

  // Training Records
  RECORD_VIEW_OWN: "record:view_own",
  RECORD_VIEW_ALL: "record:view_all",
  RECORD_CREATE: "record:create",
  RECORD_UPDATE: "record:update",

  // Requirements
  REQUIREMENT_VIEW: "requirement:view",
  REQUIREMENT_MANAGE: "requirement:manage",

  // Reports
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",

  // Admin
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  SYSTEM_SETTINGS: "system:settings",
} as const;

export const DEFAULT_ROLE_PERMISSIONS = {
  employee: [
    PERMISSIONS.SKILL_VIEW,
    PERMISSIONS.TRAINING_VIEW,
    PERMISSIONS.RECORD_VIEW_OWN,
    PERMISSIONS.CERTIFICATION_VIEW,
  ],

  supervisor: [
    PERMISSIONS.SKILL_VIEW,
    PERMISSIONS.TRAINING_VIEW,
    PERMISSIONS.TRAINING_VIEW_ALL,
    PERMISSIONS.RECORD_VIEW_OWN,
    PERMISSIONS.RECORD_VIEW_ALL, // See team records
    PERMISSIONS.CERTIFICATION_VIEW,
    PERMISSIONS.CERTIFICATION_VIEW_ALL,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.USER_VIEW,
  ],

  trainer: [
    PERMISSIONS.SKILL_VIEW,
    PERMISSIONS.TRAINING_VIEW,
    PERMISSIONS.TRAINING_VIEW_ALL,
    PERMISSIONS.TRAINING_CREATE,
    PERMISSIONS.TRAINING_UPDATE,
    PERMISSIONS.TRAINING_CONDUCT,
    PERMISSIONS.RECORD_VIEW_OWN,
    PERMISSIONS.RECORD_VIEW_ALL,
    PERMISSIONS.RECORD_CREATE,
    PERMISSIONS.CERTIFICATION_VIEW,
    PERMISSIONS.CERTIFICATION_VIEW_ALL,
    PERMISSIONS.CERTIFICATION_GRANT,
    PERMISSIONS.REPORTS_VIEW,
  ],

  admin: ["*"], // All permissions
};
```

---

## Routes Structure

```
src/app/(app)/
├── dashboard/
│   └── page.tsx                    # Overview: my training, upcoming, expiring certs
│
├── skills/
│   ├── page.tsx                    # Skill catalog (browse all skills)
│   ├── new/page.tsx                # Create skill (admin/trainer)
│   ├── [id]/
│   │   ├── page.tsx                # Skill detail (description, requirements, materials)
│   │   └── edit/page.tsx           # Edit skill
│   └── categories/
│       └── page.tsx                # Manage skill categories
│
├── training/
│   ├── page.tsx                    # Training calendar / upcoming sessions
│   ├── new/page.tsx                # Schedule new training session
│   ├── [id]/
│   │   ├── page.tsx                # Session detail (attendees, materials)
│   │   ├── edit/page.tsx           # Edit session
│   │   ├── conduct/page.tsx        # Conduct training (mark attendance, scores)
│   │   └── roster/page.tsx         # Manage attendees
│   └── history/
│       └── page.tsx                # Past training sessions
│
├── my-training/
│   ├── page.tsx                    # My training records
│   ├── skills/page.tsx             # My skills & certifications
│   └── requirements/page.tsx       # My pending requirements
│
├── certifications/
│   ├── page.tsx                    # All certifications (admin view)
│   ├── expiring/page.tsx           # Expiring soon report
│   └── [userId]/
│       └── page.tsx                # Employee certification detail
│
├── matrix/
│   └── page.tsx                    # Skill matrix (employee × skill grid)
│
├── requirements/
│   ├── page.tsx                    # Training requirements list
│   ├── new/page.tsx                # Create requirement
│   └── [id]/
│       └── page.tsx                # Requirement detail
│
├── reports/
│   ├── page.tsx                    # Reports dashboard
│   ├── compliance/page.tsx         # Compliance report
│   ├── gaps/page.tsx               # Training gap analysis
│   └── history/page.tsx            # Training history report
│
├── employees/
│   ├── page.tsx                    # Employee list (with training status)
│   └── [id]/
│       ├── page.tsx                # Employee training profile
│       └── certify/page.tsx        # Certify employee in skill
│
├── admin/
│   ├── users/...                   # User management (from template)
│   ├── roles/...                   # Role management (from template)
│   ├── settings/
│   │   ├── page.tsx                # System settings
│   │   ├── notifications/page.tsx  # Notification settings
│   │   └── training-types/page.tsx # Manage training types
│   └── audit/...                   # Audit log (from template)
│
└── profile/...                     # User profile (from template)
```

---

## Key Features by Role

### Employee
- View my skills and certifications
- See upcoming training sessions
- Enroll in available training
- View training materials
- See expiring certifications
- Acknowledge training completion

### Supervisor
- View team training status
- See who needs what training
- Assign training to team members
- View compliance reports for team
- Get alerts for expiring team certs

### Trainer
- Schedule training sessions
- Conduct training (mark attendance)
- Record training completion
- Certify employees in skills
- Upload training materials
- View training history

### Admin
- Manage skills catalog
- Configure training requirements
- Manage users and roles
- View all reports
- System configuration
- Audit log access

---

## Key Workflows

### 1. New Employee Onboarding
```
1. Employee created in system
2. System evaluates training requirements for role/department
3. Required training auto-assigned
4. Employee sees pending requirements on dashboard
5. Supervisor notified of new team member's training needs
```

### 2. Schedule & Conduct Training
```
1. Trainer creates training session
2. Employees enroll (or are assigned)
3. Session conducted
4. Trainer marks attendance and pass/fail
5. Training records created automatically
6. Employee skills updated
7. If certification threshold met, certification granted
```

### 3. Certification Expiration
```
1. Cron job checks for expiring certs (30, 14, 7 days)
2. Notifications sent to employee and supervisor
3. If expired, status changes to "expired"
4. Employee appears on compliance reports
5. Recertification training assigned
```

### 4. Ad-hoc OJT
```
1. Trainer/supervisor logs OJT for employee
2. Skill, hours, date recorded
3. Training hours accumulate
4. When threshold met, can certify employee
```

---

## Sidebar Navigation

```typescript
// src/components/layout/sidebar-nav-config.tsx

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Training", href: "/my-training", icon: GraduationCap },
    ],
  },
  {
    label: "Training",
    items: [
      { label: "Calendar", href: "/training", icon: Calendar, permission: PERMISSIONS.TRAINING_VIEW },
      { label: "Skill Catalog", href: "/skills", icon: BookOpen, permission: PERMISSIONS.SKILL_VIEW },
      { label: "Skill Matrix", href: "/matrix", icon: Grid, permission: PERMISSIONS.CERTIFICATION_VIEW_ALL },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Employees", href: "/employees", icon: Users, permission: PERMISSIONS.CERTIFICATION_VIEW_ALL },
      { label: "Certifications", href: "/certifications", icon: Award, permission: PERMISSIONS.CERTIFICATION_VIEW_ALL },
      { label: "Requirements", href: "/requirements", icon: ClipboardList, permission: PERMISSIONS.REQUIREMENT_VIEW },
      { label: "Reports", href: "/reports", icon: BarChart, permission: PERMISSIONS.REPORTS_VIEW },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, permission: PERMISSIONS.USER_VIEW },
      { label: "Roles", href: "/admin/roles", icon: Shield, permission: PERMISSIONS.USER_VIEW },
      { label: "Settings", href: "/admin/settings", icon: Settings, permission: PERMISSIONS.SYSTEM_SETTINGS },
      { label: "Audit Log", href: "/admin/audit", icon: FileText, permission: PERMISSIONS.SYSTEM_SETTINGS },
    ],
  },
];
```

---

## Dashboard Widgets

### Employee Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ Welcome, John                                               │
├───────────────┬───────────────┬───────────────┬─────────────┤
│ My Skills     │ Expiring Soon │ Pending       │ Hours YTD   │
│     12        │      2        │      3        │    24.5     │
├───────────────┴───────────────┴───────────────┴─────────────┤
│ Upcoming Training                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Jan 15 - Forklift Refresher (2 hrs) - Room 101         │ │
│ │ Jan 22 - ESD Training (1 hr) - Online                  │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Expiring Certifications                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ LOTO - Expires Feb 1 (29 days)                       │ │
│ │ ⚠️ First Aid - Expires Feb 15 (43 days)                 │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Pending Requirements                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 Hazmat Awareness - Due Jan 20 (17 days)              │ │
│ │ 🟡 Quality Basics - Due Feb 28 (56 days)                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Supervisor Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ Team Training Status - Assembly Dept                        │
├───────────────┬───────────────┬───────────────┬─────────────┤
│ Team Members  │ Compliant     │ Expiring Soon │ Overdue     │
│     15        │     11        │      3        │     1       │
├───────────────┴───────────────┴───────────────┴─────────────┤
│ Compliance Rate: 73% ████████████░░░░                       │
├─────────────────────────────────────────────────────────────┤
│ Action Required                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 Mike T. - LOTO expired 3 days ago                    │ │
│ │ ⚠️ Sarah K. - Forklift expires in 7 days                │ │
│ │ ⚠️ Joe R. - First Aid expires in 14 days                │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Upcoming Team Training                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Jan 15 - LOTO Refresher - 5 team members enrolled       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Skill Matrix View

```
┌──────────────────────────────────────────────────────────────────┐
│ Skill Matrix - Assembly Department                               │
├──────────────┬───────┬───────┬───────┬───────┬───────┬───────────┤
│ Employee     │ LOTO  │ Fork  │ ESD   │ First │ Press │ Weld      │
│              │       │ lift  │       │ Aid   │ Setup │           │
├──────────────┼───────┼───────┼───────┼───────┼───────┼───────────┤
│ Mike T.      │  ✓    │  ✓    │  ✓    │  ⚠️   │  ✓    │   -       │
│ Sarah K.     │  ✓    │  ⚠️   │  ✓    │  ✓    │  ✓    │   ✓       │
│ Joe R.       │  ✓    │  ✓    │  ✓    │  ⚠️   │   -   │   -       │
│ Lisa M.      │  ✓    │   -   │  ✓    │  ✓    │  ✓    │   ✓       │
│ Tom B.       │  ❌   │  ✓    │  ✓    │  ✓    │   -   │   -       │
├──────────────┴───────┴───────┴───────┴───────┴───────┴───────────┤
│ Legend: ✓ Certified  ⚠️ Expiring  ❌ Expired/Missing  - N/A      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up from template
- [ ] Implement schema
- [ ] Create skill categories CRUD
- [ ] Create skills CRUD
- [ ] Basic navigation

### Phase 2: Core Features (Week 2)
- [ ] Employee skills tracking
- [ ] Training sessions CRUD
- [ ] Training records
- [ ] Basic dashboard

### Phase 3: Certification (Week 3)
- [ ] Certification logic (grant/expire)
- [ ] Expiration tracking
- [ ] Certification reports
- [ ] Expiring soon alerts

### Phase 4: Requirements & Compliance (Week 4)
- [ ] Training requirements CRUD
- [ ] Requirement evaluation logic
- [ ] Compliance dashboard
- [ ] Gap analysis

### Phase 5: Polish (Week 5)
- [ ] Skill matrix view
- [ ] Training calendar
- [ ] Email notifications
- [ ] Export/reports
- [ ] Mobile optimization

---

## Seed Data

```typescript
// Initial skill categories
const categories = [
  { name: "Safety", color: "#EF4444" },
  { name: "Equipment Operation", color: "#3B82F6" },
  { name: "Quality", color: "#10B981" },
  { name: "Process", color: "#F59E0B" },
  { name: "Leadership", color: "#8B5CF6" },
];

// Initial training types
const trainingTypes = [
  { name: "Classroom", code: "CLASS", requiresInstructor: true },
  { name: "On-the-Job (OJT)", code: "OJT", requiresInstructor: true },
  { name: "Online", code: "ONLINE", requiresInstructor: false },
  { name: "External", code: "EXT", requiresInstructor: true },
  { name: "Self-Study", code: "SELF", requiresInstructor: false },
];

// Example skills
const skills = [
  {
    name: "Lockout/Tagout (LOTO)",
    code: "LOTO",
    category: "Safety",
    requiresCertification: true,
    certificationValidityMonths: 12,
    requiredTrainingHours: 4,
  },
  {
    name: "Forklift Operation",
    code: "FORK",
    category: "Equipment Operation",
    requiresCertification: true,
    certificationValidityMonths: 36,
    requiredTrainingHours: 8,
  },
  {
    name: "First Aid/CPR",
    code: "FA-CPR",
    category: "Safety",
    requiresCertification: true,
    certificationValidityMonths: 24,
    requiredTrainingHours: 8,
  },
];
```

---

## Future Enhancements

- **Online course integration** - SCORM/xAPI support
- **Quiz builder** - Create assessments within app
- **Mobile app** - Native app for floor scanning/check-ins
- **QR code sign-in** - Scan to mark attendance
- **Calendar integration** - Sync with Outlook/Google
- **API for integrations** - Connect to HR systems
- **Multi-language** - Support for multilingual workforce
- **Offline mode** - PWA for offline training logging
