CREATE TABLE "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"type" text NOT NULL,
	"filename" text NOT NULL,
	"s3_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"display_id" serial NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"manager_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name"),
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"display_id" serial NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"owner_id" text,
	"department_id" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"display_id" serial NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "skill_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"display_id" serial NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"color" text,
	"parent_id" text,
	"path" text DEFAULT '' NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"type" text DEFAULT 'department' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skill_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "skill_prerequisites" (
	"id" text PRIMARY KEY NOT NULL,
	"skill_id" text NOT NULL,
	"prerequisite_skill_id" text NOT NULL,
	"minimum_proficiency_level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"display_id" serial NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"category_id" text,
	"parent_skill_id" text,
	"depth" integer DEFAULT 0 NOT NULL,
	"path" text DEFAULT '' NOT NULL,
	"has_proficiency_levels" boolean DEFAULT false NOT NULL,
	"max_proficiency_level" integer DEFAULT 3 NOT NULL,
	"requires_certification" boolean DEFAULT false NOT NULL,
	"certification_validity_months" integer,
	"required_training_hours" integer,
	"allow_ojt" boolean DEFAULT true NOT NULL,
	"allow_classroom" boolean DEFAULT true NOT NULL,
	"allow_online" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by_id" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"display_id" serial NOT NULL,
	"employee_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"pin" text NOT NULL,
	"role_id" text,
	"department_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"preferences" jsonb,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_parent_id_skill_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."skill_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_prerequisite_skill_id_skills_id_fk" FOREIGN KEY ("prerequisite_skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_parent_skill_id_skills_id_fk" FOREIGN KEY ("parent_skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "proj_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proj_owner_idx" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "proj_dept_idx" ON "projects" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "proj_search_idx" ON "projects" USING gin (to_tsvector('english', "name" || ' ' || coalesce("description", '')));--> statement-breakpoint
CREATE INDEX "category_parent_idx" ON "skill_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "category_path_idx" ON "skill_categories" USING btree ("path");--> statement-breakpoint
CREATE INDEX "category_type_idx" ON "skill_categories" USING btree ("type");--> statement-breakpoint
CREATE INDEX "category_slug_idx" ON "skill_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "prereq_skill_idx" ON "skill_prerequisites" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "prereq_prereq_skill_idx" ON "skill_prerequisites" USING btree ("prerequisite_skill_id");--> statement-breakpoint
CREATE INDEX "skill_category_idx" ON "skills" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "skill_parent_idx" ON "skills" USING btree ("parent_skill_id");--> statement-breakpoint
CREATE INDEX "skill_path_idx" ON "skills" USING btree ("path");--> statement-breakpoint
CREATE INDEX "skill_active_idx" ON "skills" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "skill_search_idx" ON "skills" USING gin (to_tsvector('english', "name" || ' ' || coalesce("code", '') || ' ' || coalesce("description", '')));--> statement-breakpoint
CREATE INDEX "users_dept_role_idx" ON "users" USING btree ("department_id","role_id");