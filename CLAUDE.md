# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrightMiss is a Next.js 14+ user management system with authentication, role-based access control, and profile management. Built with TypeScript, Prisma (PostgreSQL), NextAuth.js v5, and UploadThing for file uploads.

## Common Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Database (Prisma)
```bash
npx prisma generate                        # Generate Prisma Client
npx prisma migrate dev --name <name>       # Create and apply migration
npx prisma migrate deploy                  # Apply migrations (production)
npx prisma migrate reset                   # Reset database (drops all data)
npx prisma db seed                         # Seed admin user from env vars
npx prisma studio                          # Open Prisma Studio GUI
```

## Architecture

### Authentication System (NextAuth.js v5)

- **Session Strategy**: JWT-based (no database sessions)
- **Auth Configuration**: [lib/auth.ts](lib/auth.ts) exports `auth()`, `signIn()`, `signOut()`
- **Type Extensions**: [types/next-auth.d.ts](types/next-auth.d.ts) adds `id` and `role` to session/token
- **Middleware**: [middleware.ts](middleware.ts) protects routes based on auth status and role
  - Public routes: `/`, `/login`, `/register`, `/invite/*`
  - Admin routes: `/admin/*` (requires ADMIN role)
  - All other routes require authentication

**Authentication Flow**:
1. User logs in via credentials provider
2. Password verified with bcryptjs (10 rounds)
3. JWT token issued with user id + role
4. `lastLogin` timestamp updated in database
5. Middleware checks JWT on every request

### Database Models (Prisma)

**User** - Authentication and core user data
- Fields: `id`, `email` (unique), `password` (nullable for invited users), `name`, `role`, `isInvited`, `lastLogin`
- Relations: One-to-one `UserProfile`, one-to-many `InviteToken`
- Roles: `ADMIN` | `SUB` (enum defined in schema)

**UserProfile** - Extended user information
- Cascade deletes with User
- Personal info: firstName, lastName, dateOfBirth, bio
- Contact: phone, address, city, postalCode, country
- JSON fields: `emergencyContacts`, `socialMedia`
- Media: profileImage, coverImage, galleryImages[], videos[]

**InviteToken** - Invitation system
- Used for admin-invited users
- Fields: `token` (unique), `expiresAt` (7 days), `used`
- Cascade deletes with User

### API Route Pattern

All API routes follow this pattern:
1. Import `auth()` from [lib/auth.ts](lib/auth.ts)
2. Check session exists: `if (!session?.user?.id) return 401`
3. For admin routes: `if (session.user.role !== "ADMIN") return 403`
4. Validate request body with Zod schemas
5. Use `prisma` from [lib/prisma.ts](lib/prisma.ts) for database operations
6. Return JSON responses with appropriate status codes

Example admin route authorization:
```typescript
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
if (session.user.role !== "ADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
```

### File Upload System (UploadThing)

Configuration in [lib/uploadthing.ts](lib/uploadthing.ts):
- **imageUploader**: Single image, 4MB max
- **galleryUploader**: 10 images, 4MB each
- **videoUploader**: 5 videos, 16MB each

All uploaders check auth via middleware, return file URL on completion.

### Route Structure

```
app/
├── admin/
│   ├── dashboard/              # Admin: view all users
│   └── users/
│       ├── invite/             # Admin: invite users
│       └── [userId]/           # Admin: view user details
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/      # NextAuth handlers
│   │   ├── register/           # POST: create new user
│   │   └── set-password/       # POST: set password for invited users
│   ├── profile/                # GET/PATCH: current user profile
│   ├── admin/
│   │   ├── invite/             # POST: create invite token
│   │   └── users/              # GET: list users, DELETE: remove user
│   └── uploadthing/            # File upload handlers
├── invite/[token]/             # Complete invitation, set password
├── profile/                    # View/edit current user profile
├── login/                      # Login page
└── register/                   # Self-registration page
```

## Key Architectural Decisions

### User Registration Flows

1. **Self-Registration** ([app/register/page.tsx](app/register/page.tsx)):
   - User provides name, email, password
   - Password hashed immediately
   - Auto-login after registration
   - Role defaults to SUB

2. **Admin Invitation** ([app/api/admin/invite/route.ts](app/api/admin/invite/route.ts)):
   - Admin provides name, email
   - User created with `password: null`, `isInvited: true`
   - InviteToken generated (UUID, 7-day expiry)
   - User visits `/invite/[token]` to set password
   - Token marked as used after password set

### Path Aliases

TypeScript configured with `@/*` alias pointing to root directory. Use for all imports:
```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
```

### Environment Variables

Required for development (.env file):
```
DATABASE_URL="postgresql://user:password@localhost:5432/brightmiss"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
UPLOADTHING_SECRET="<from uploadthing.com>"
UPLOADTHING_APP_ID="<from uploadthing.com>"
ADMIN_EMAIL="admin@brightmiss.com"
ADMIN_PASSWORD="admin123"
ADMIN_NAME="Admin User"
```

## Making Changes

### Adding Profile Fields

1. Update `UserProfile` model in [prisma/schema.prisma](prisma/schema.prisma)
2. Run: `npx prisma migrate dev --name add_field_name`
3. Update Zod schema in [app/api/profile/route.ts](app/api/profile/route.ts)
4. Update UI in [app/profile/edit/page.tsx](app/profile/edit/page.tsx)

### Adding User Roles

1. Add role to `Role` enum in [prisma/schema.prisma](prisma/schema.prisma)
2. Run migration
3. Update TypeScript types in [types/next-auth.d.ts](types/next-auth.d.ts)
4. Update middleware routing logic in [middleware.ts](middleware.ts)
5. Create role-specific pages/API routes

### Creating New API Routes

Follow the established pattern:
- Use `auth()` for authentication
- Use Zod for validation
- Use `prisma` singleton for database access
- Return proper HTTP status codes
- Log errors to console for debugging
