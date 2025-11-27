# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrightMiss is a Next.js 16 user management system with authentication, role-based access control, and profile management. Built with TypeScript, React 19, Prisma (PostgreSQL), NextAuth.js v5, Tailwind CSS v4, and UploadThing for file uploads.

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
- **Route Protection**: No middleware - all auth/role checks happen server-side in route handlers
  - Public routes: `/`, `/login`, `/register`, `/invite/*`
  - Protected routes: Checked via `auth()` in individual route handlers
  - Admin routes: Checked via `session.user.role !== "ADMIN"` in route handlers

**Authentication Flow**:
1. User logs in via credentials provider
2. Password verified with bcryptjs (10 rounds)
3. JWT token issued with user id + role
4. `lastLogin` timestamp updated in database
5. Session available via `auth()` function in route handlers

### Database Models (Prisma)

**User** - Authentication and core user data
- Fields: `id`, `email` (unique), `password` (nullable for invited users), `name`, `role`, `isInvited`, `inviteToken`, `lastLogin`
- Relations: One-to-one `UserProfile`, one-to-many `InviteToken`
- Roles: `ADMIN` | `SUB` (enum defined in schema)

**UserProfile** - Extended user information

Cascade deletes with User. Contains basic profile fields, verification phase fields, and locking system fields.

*Basic Profile Fields:*
- Personal info: firstName, lastName, dateOfBirth, bio, workPlace
- Contact: phone, address, city, postalCode, country
- JSON fields: `emergencyContacts`, `socialMedia`
- Media: profileImage, coverImage, galleryImages[], videos[]

*Verification Phase Fields:*
The system includes three verification phases for comprehensive identity management:

- **Phase 1 - Identity Verification**
  - Fields: fullLegalName, secondaryPhone, privateEmail, cloudEmail, idNumber, licensePlate

- **Phase 2 - Digital & Financial**
  - Fields: paymentDetails, amazonWishlist, remoteControlId, streamingAccounts (JSON), mobileDevice

- **Phase 3 - Vault (Secure Documents)**
  - Fields: vaultImages[], vaultVideos[], idCardImages[], declarationImage, declarationFaceImage

*Profile Locking Fields:*
- changeRequested, firstName/lastName/phone/address/workPlace + *Approved/*Locked/*Pending variants
- See "Profile Locking System" section below for details

**InviteToken** - Invitation system
- Used for admin-invited users
- Fields: `token` (unique), `expiresAt` (7 days), `used`
- Cascade deletes with User

### UI Components & Theme System

**Theme Provider** ([app/providers.tsx](app/providers.tsx))
- Wraps application with SessionProvider (NextAuth) and ThemeProvider (next-themes)
- Configured with forced dark theme: `defaultTheme="dark" enableSystem={false} forcedTheme="dark"`
- Applied in [app/layout.tsx](app/layout.tsx)

**Component Library** ([components/ui/](components/ui/))
- shadcn/ui-style components: badge, button, dialog, input, label, table, textarea
- Toast notifications via sonner ([components/ui/sonner.tsx](components/ui/sonner.tsx))
- Toaster component added to root layout for global notifications
- Custom UploadThing components ([components/uploadthing.tsx](components/uploadthing.tsx))

**Styling**
- Tailwind CSS v4 with @tailwindcss/postcss
- Custom animations via tailwindcss-animate
- Utility helpers: clsx, tailwind-merge, class-variance-authority
- Geist Sans and Geist Mono fonts from next/font/google

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

### Profile Locking System

Admins can approve and lock specific profile fields to prevent unauthorized changes.

**Lockable Fields**: firstName, lastName, phone, address, workPlace

**Flow**:
1. Admin approves a field → field becomes locked
2. User attempts to edit locked field → change saved to `*Pending` field, `changeRequested` set to true
3. Admin views pending requests at [/admin/requests](app/admin/requests/page.tsx) or via `GET /api/admin/profile-requests`
4. Admin approves → pending value moves to main field, remains locked
5. Admin rejects → pending value cleared

**API Routes**:
- `GET /api/admin/profile-requests` - List all pending change requests
- `PATCH /api/admin/profile-requests` - Approve/reject requests
  - Body: `{ userId, fieldName, action: "approve"|"reject", comment? }`

**Database Fields per Lockable Field**:
For each lockable field (e.g., `firstName`):
- `firstName` - Current approved value
- `firstNameApproved` - Boolean, whether field has been admin-approved
- `firstNameLocked` - Boolean, whether field is locked from user edits
- `firstNamePending` - Nullable string, user's requested change awaiting admin review

**UserProfile Fields**:
- `changeRequested` - Boolean flag indicating user has pending changes

### Route Structure

```
app/
├── admin/
│   ├── dashboard/              # Admin: view all users
│   ├── requests/               # Admin: manage profile change requests
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
│   │   ├── profile-requests/   # GET: list pending requests, PATCH: approve/reject
│   │   └── users/              # GET: list users, DELETE: remove user
│   └── uploadthing/            # File upload handlers
├── invite/[token]/             # Complete invitation, set password
├── profile/                    # View/edit current user profile
│   └── edit/                   # Edit profile page
├── login/                      # Login page
├── register/                   # Self-registration page
├── providers.tsx               # SessionProvider + ThemeProvider wrapper
└── layout.tsx                  # Root layout with Providers and Toaster
```

```
components/
└── ui/                         # shadcn/ui-style components
    ├── badge.tsx
    ├── button.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── label.tsx
    ├── sonner.tsx              # Toast notifications
    ├── table.tsx
    └── textarea.tsx
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
2. Run migration: `npx prisma migrate dev --name add_role`
3. Update TypeScript types in [types/next-auth.d.ts](types/next-auth.d.ts)
4. Update role checks in API route handlers as needed
5. Create role-specific pages and API routes

### Creating New API Routes

Follow the established pattern:
- Use `auth()` for authentication
- Use Zod for validation
- Use `prisma` singleton for database access
- Return proper HTTP status codes
- Log errors to console for debugging
