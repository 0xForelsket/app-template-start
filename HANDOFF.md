# Handoff: Factory App Template Transformation

## Current Status
The transformation from FixIt CMMS to a generic Factory App Template is **95% complete**. The codebase is now generic, and the Projects domain serves as the reference implementation.

## Work Completed
1.  **Schema & Permissions**: Simplified `src/db/schema.ts` and `src/lib/permissions.ts`.
2.  **TypeScript Errors**: Fixed all critical errors related to removed fields (e.g., `hourlyRate`, `workOrders`).
3.  **UI Components**:
    *   Created `src/components/ui/switch.tsx`.
    *   Fixed `DataTable` usage in `projects-table.tsx`.
    *   Updated `Sidebar` and `Header` to be generic.
4.  **Auth & Session**: Removed CMMS-specific fields from `SessionUser`.
5.  **Profile & Settings**:
    *   Decoupled profile settings from the old `@/data/profile` module.
    *   Simplified notification preferences (removed `inApp` work order specific settings).
6.  **Navigation**: Updated `nav.tsx` and `sidebar-nav-config.tsx` to point to Dashboard and Projects.
7.  **Linting**: Ran `biome` auto-fixes across the codebase.

## Remaining Tasks
1.  **Manifest Update**: `public/manifest.json` still references "FixIt CMMS". Update it to "Factory App".
2.  **Public Assets**: Update icons (`icon.svg`, `logo.svg`, etc.) if needed, or at least ensure they are generic.
3.  **Search References**: A few "FixIt" references might still exist in comments or non-code files.
4.  **Final Verification**:
    *   Run `bun run db:push` then `bun run db:seed`.
    *   Verify login works with `ADMIN-001 / 1234`.
    *   Ensure Projects CRUD is fully functional.
    *   Check Admin routes (Users, Roles, Settings).

## Critical Files
*   `src/db/schema.ts`: The source of truth for the generic schema.
*   `src/lib/permissions.ts`: Defines the `PROJECT_*` and `USER_*` permissions.
*   `src/app/(app)/projects/`: Example implementation.

## Build Status
`bunx tsc --noEmit` is currently passing with 0 errors.
`bun run lint` passes with some minor style warnings remaining in scripts.
