# Factory App Template

A reusable Next.js template for building factory/industrial applications with built-in authentication, permissions, and CRUD patterns.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## What's Included

- **Authentication** - PIN-based login (factory floor friendly) with JWT sessions
- **Permission System** - Role-based access with granular `resource:action` permissions
- **User Management** - Create users, roles, and assign permissions
- **Reusable UI** - 50+ UI components (Radix UI + Tailwind CSS)
- **Example Domain** - Projects CRUD as a reference implementation
- **PWA Support** - Mobile-friendly with offline capabilities

## Use Cases

Build focused factory/industrial apps like:

- Training & Certification Tracking
- Problem Solving / Corrective Actions
- Safety Incident Reporting
- 5S / Lean Audits
- Tool Crib / Checkout Systems

See `APP-IDEAS.md` for more ideas with schema suggestions.

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 with App Router (React 19) |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL with Drizzle ORM |
| **Styling** | Tailwind CSS 4 + Radix UI primitives |
| **Storage** | S3/MinIO for file attachments |
| **Auth** | JWT sessions with PIN-based login + CSRF protection |
| **Testing** | Vitest (unit) + Playwright (e2e) |
| **Linting** | Biome |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- PostgreSQL database
- Docker (optional, for MinIO storage)

### Installation

```bash
# Clone the template
git clone <repository-url> my-app
cd my-app

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Generate a session secret (add to .env)
openssl rand -base64 32

# Start MinIO storage (optional, for file uploads)
docker-compose up -d
bun run minio:setup

# Initialize database
bun run db:push
bun run db:seed

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

| Role       | Employee ID | PIN  |
|------------|-------------|------|
| Admin      | ADMIN-001   | 1234 |
| Supervisor | SUP-001     | 5678 |
| Employee   | EMP-001     | 0000 |

## Environment Variables

```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/myapp

# Session (REQUIRED - must be 32+ characters)
SESSION_SECRET=your-secret-key-here-must-be-at-least-32-chars

# S3/MinIO Storage (optional)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=my-app-attachments
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

> **Important:** `SESSION_SECRET` is required in all environments. Generate with `openssl rand -base64 32`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login page
│   ├── (app)/             # Main authenticated routes
│   │   ├── admin/         # Admin panel (users, roles, settings)
│   │   ├── dashboard/     # Welcome page
│   │   ├── projects/      # Example domain
│   │   └── profile/       # User profile
│   └── api/               # REST API endpoints
├── actions/               # Server actions (mutations)
├── components/            
│   ├── ui/               # Reusable UI primitives
│   └── layout/           # Header, sidebar, navigation
├── db/
│   ├── schema.ts         # Drizzle ORM schema
│   ├── index.ts          # Database client
│   └── seed.ts           # Development seed data
├── lib/
│   ├── session.ts        # JWT session management
│   ├── auth.ts           # Auth utilities
│   ├── permissions.ts    # Permission constants
│   └── validations/      # Zod schemas
└── hooks/                # React hooks
```

## Adding Your Own Domain

Follow the patterns in `CLAUDE.md` and `PATTERNS.md`:

1. **Database Schema** - Add table to `src/db/schema.ts`
2. **Permissions** - Add to `src/lib/permissions.ts`
3. **Validation** - Create `src/lib/validations/your-entity.ts`
4. **Actions** - Create `src/actions/your-entity.ts`
5. **Routes** - Create `src/app/(app)/your-entity/`
6. **Navigation** - Add to `src/components/layout/sidebar-nav-config.tsx`
7. **Push schema** - Run `bun run db:push`

The Projects domain is included as a complete reference implementation.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Build for production |
| `bun run build:check` | TypeScript compilation check |
| `bun run lint` | Check code with Biome |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run test` | Run unit tests |
| `bun run e2e` | Run Playwright e2e tests |
| `bun run db:push` | Push schema to database |
| `bun run db:seed` | Seed development data |
| `bun run db:studio` | Open Drizzle Studio |

## Permission System

Permissions follow the `resource:action` pattern:

| Resource | Available Actions |
|----------|-------------------|
| project | view, create, update, delete |
| user | view, create, update, delete |
| system | settings |

Special permission `*` grants all permissions (superadmin).

Create custom roles via the Admin UI with any combination of permissions.

## Security Features

- **JWT Sessions** - HttpOnly cookies with configurable expiry
- **CSRF Protection** - Token-based protection for all mutations
- **Rate Limiting** - Configurable limits per endpoint
- **Account Lockout** - 15-minute lockout after 5 failed login attempts
- **Permission Checks** - Server-side enforcement on all actions

## Documentation

- `CLAUDE.md` - Development patterns and conventions
- `PATTERNS.md` - Detailed CRUD patterns and component usage
- `APP-IDEAS.md` - Factory app ideas with schemas
- `LMS.md` - Full implementation plan for Training app (example)

## License

MIT License
