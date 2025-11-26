# BrightMiss - User Management System

A comprehensive web application built with Next.js 14+ featuring user registration, profile management, role-based access control, and an admin dashboard.

## Features

- **Authentication & Authorization**
  - User registration with automatic login
  - Secure credential-based authentication (NextAuth.js v5)
  - Role-based access control (Admin & Sub users)
  - Session management with JWT

- **User Profile Management**
  - Comprehensive user profiles with personal information
  - Contact details and emergency contacts
  - Social media links
  - File uploads for images and videos (UploadThing)

- **Admin Dashboard**
  - View all users with detailed information
  - User invitation system with magic links
  - User detail pages with full profile access
  - User management (view, invite, delete)

- **Invitation System**
  - Admin can invite users via email
  - Secure token-based invitation links (7-day expiry)
  - Invited users set their password on first login

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **File Upload**: UploadThing
- **Validation**: Zod
- **Forms**: React Hook Form

## Project Structure

```
brightmiss/
├── app/
│   ├── admin/
│   │   ├── dashboard/       # Admin dashboard
│   │   └── users/           # User management pages
│   ├── api/
│   │   ├── auth/            # Authentication endpoints
│   │   ├── profile/         # Profile API routes
│   │   ├── admin/           # Admin API routes
│   │   └── uploadthing/     # File upload endpoints
│   ├── invite/              # Invite token pages
│   ├── login/               # Login page
│   ├── profile/             # User profile pages
│   ├── register/            # Registration page
│   └── page.tsx             # Landing page
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Prisma client
│   ├── uploadthing.ts       # UploadThing configuration
│   └── utils.ts             # Utility functions
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeding script
├── types/
│   └── next-auth.d.ts       # NextAuth type extensions
└── middleware.ts            # Route protection middleware
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- UploadThing account (for file uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brightmiss
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your actual values:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/brightmiss?schema=public"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
   NEXTAUTH_URL="http://localhost:3000"

   # UploadThing (get from uploadthing.com)
   UPLOADTHING_SECRET="your-uploadthing-secret"
   UPLOADTHING_APP_ID="your-uploadthing-app-id"

   # Admin Seed
   ADMIN_EMAIL="admin@brightmiss.com"
   ADMIN_PASSWORD="admin123"
   ADMIN_NAME="Admin User"
   ```

4. **Set up the database**

   Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

   Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed the database with admin user**
   ```bash
   npx prisma db seed
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Initial Setup

1. **Admin Login**
   - Navigate to `/login`
   - Use the admin credentials from your `.env` file:
     - Email: `admin@brightmiss.com` (or your ADMIN_EMAIL)
     - Password: `admin123` (or your ADMIN_PASSWORD)

### User Registration

1. **Self-Registration**
   - Navigate to `/register`
   - Fill in name, email, and password
   - Automatically logged in after registration
   - Role is set to "SUB" by default

2. **Admin Invitation**
   - Admin navigates to `/admin/users/invite`
   - Enters user's name and email
   - System generates invite link (valid for 7 days)
   - Send invite link to user via email or other channel
   - User clicks link and sets password at `/invite/[token]`

### User Profile

- View profile: `/profile`
- Edit profile: `/profile/edit`
- Update personal information, contact details, bio, etc.
- Upload profile images and videos (requires UploadThing setup)

### Admin Dashboard

- Access dashboard: `/admin/dashboard`
- View all users and statistics
- Click "View" to see detailed user information
- Invite new users via the "Invite User" button
- Delete users (except yourself)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `POST /api/auth/set-password` - Set password for invited users

### Profile
- `GET /api/profile` - Get current user's profile
- `PATCH /api/profile` - Update current user's profile

### Admin (Admin Only)
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[userId]` - Get user details
- `POST /api/admin/invite` - Invite new user
- `DELETE /api/admin/users/[userId]` - Delete user

### File Upload
- `GET/POST /api/uploadthing` - UploadThing file upload handlers

## Database Schema

### User
- id (UUID)
- email (unique)
- password (hashed, nullable for invited users)
- name
- role (ADMIN | SUB)
- isInvited (boolean)
- lastLogin (DateTime)
- createdAt, updatedAt

### UserProfile
- id (UUID)
- userId (foreign key)
- firstName, lastName
- dateOfBirth
- bio
- phone, address, city, postalCode, country
- emergencyContacts (JSON)
- socialMedia (JSON)
- profileImage, coverImage
- galleryImages (array)
- videos (array)
- createdAt, updatedAt

### InviteToken
- id (UUID)
- userId (foreign key)
- token (unique)
- expiresAt (DateTime)
- used (boolean)
- createdAt

## Security Features

- Password hashing with bcryptjs (10 rounds)
- JWT-based session management
- CSRF protection (NextAuth)
- Route protection middleware
- Role-based access control
- Invite token expiration (7 days)
- File upload validation

## Development

### Database Management

**View database in Prisma Studio:**
```bash
npx prisma studio
```

**Create a new migration:**
```bash
npx prisma migrate dev --name migration_name
```

**Reset database:**
```bash
npx prisma migrate reset
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Environment Variables

Make sure to set all required environment variables in your production environment:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL
- `UPLOADTHING_SECRET` - From uploadthing.com
- `UPLOADTHING_APP_ID` - From uploadthing.com

### Database

Run migrations in production:
```bash
npx prisma migrate deploy
```

Seed admin user:
```bash
npx prisma db seed
```

## Extending the Application

### Adding New Profile Fields

1. Update `prisma/schema.prisma` - add field to UserProfile model
2. Run migration: `npx prisma migrate dev --name add_field_name`
3. Update profile API validation in `app/api/profile/route.ts`
4. Update profile edit form in `app/profile/edit/page.tsx`
5. Update profile display in `app/profile/page.tsx`

### Adding New User Roles

1. Update `prisma/schema.prisma` - add role to Role enum
2. Run migration: `npx prisma migrate dev --name add_role`
3. Update NextAuth types in `types/next-auth.d.ts`
4. Update middleware for role-based routing
5. Create role-specific pages and API routes

### Email Integration

To send actual emails for invitations:
1. Install email service (e.g., Resend, SendGrid)
2. Update `app/api/admin/invite/route.ts` to send email
3. Create email templates
4. Add email configuration to `.env`

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists and user has permissions

### Prisma Issues
- Run `npx prisma generate` after schema changes
- Clear `.next` folder and restart dev server
- Check Prisma logs in console

### Authentication Issues
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
