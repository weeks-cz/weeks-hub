# Profiles & Admin Redesign

## Summary

Add 3-tier role system (developer/admin/member), extended user profiles with fun fields and avatar upload via Supabase Storage, and a new admin section at `/admin`.

## Role System

| Role | DB value | Who | Permissions |
|------|----------|-----|-------------|
| Developer | `developer` | Lukáš Kubík | Everything — manage roles, delete users, audit log, app settings |
| Admin | `admin` | Kryštof, Štěpán | Manage camps, forms, edit other users' profiles. Cannot change roles or delete users |
| Member | `member` | Everyone else | Edit own profile only |

## Database Changes

### Alter `users` table

Add columns:
- `position` TEXT — job title/position
- `phone` TEXT — phone number
- `favorite_sport` TEXT
- `favorite_color` TEXT
- `favorite_food` TEXT
- `motto` TEXT
- `custom_avatar_url` TEXT — uploaded avatar overriding Google OAuth avatar

Alter role constraint:
- FROM: `CHECK (role IN ('admin', 'member'))`
- TO: `CHECK (role IN ('developer', 'admin', 'member'))`

### New RLS policies

- Admin/developer can UPDATE other users' profiles (except role field for admin)
- Developer can UPDATE any field including role
- Developer can DELETE users
- Existing member policies unchanged (own profile only)

### Supabase Storage

- Bucket: `avatars` (public read)
- Path pattern: `{user_id}/avatar.{ext}`
- Constraints: max 2MB, image types only (jpg, png, webp)
- RLS: users can upload/delete only their own path; admin/developer can manage any

## Avatar Logic

Display priority: `custom_avatar_url || avatar_url || initials fallback`

Upload flow:
1. User selects image file
2. Client-side validation (size, type)
3. Upload to Supabase Storage `avatars/{user_id}/avatar.{ext}`
4. Save public URL to `custom_avatar_url` column
5. Option to remove custom avatar (reverts to Google/initials)

## Extended Profile Page (`/profile`)

Layout:
- Gradient banner + large avatar with upload overlay button
- Name, position, email, phone, role badge
- "Fun" section: sport, color, food, motto
- Edit button → `/profile/edit`

## Extended Profile Edit (`/profile/edit`)

Sections:
1. Avatar upload (drag & drop or click)
2. Basic info: full name, position, phone
3. Bio (textarea)
4. Fun fields: favorite sport, color, food, motto
5. Save/Cancel buttons

## Admin Section

### `/admin` — Dashboard
- Visible in sidebar only for admin/developer roles
- Stats: total users, camps, form submissions
- Quick links to sub-pages

### `/admin/users` — User Management
- Table of all users with avatar, name, email, role, position
- Admin: can edit other users' profiles (name, bio, position, phone, fun fields)
- Developer only: can change roles, delete users
- Search/filter by name or role

### Navigation
- New sidebar item "Admin" with Shield icon
- Only rendered when `user.role === 'admin' || user.role === 'developer'`

## Component Changes

### Modified
- `src/types/database.ts` — extend User interface, add UserRole type
- `src/app/(authenticated)/profile/page.tsx` — new layout with extended fields
- `src/app/(authenticated)/profile/edit/page.tsx` — add all new fields + avatar upload
- `src/components/ui/Avatar.tsx` — use `custom_avatar_url || avatar_url` logic
- `src/components/layout/Sidebar.tsx` (or equivalent) — add Admin nav item with role check
- `src/contexts/AuthContext.tsx` — updateUser to handle new fields

### New
- `src/app/(authenticated)/admin/page.tsx` — admin dashboard
- `src/app/(authenticated)/admin/users/page.tsx` — user management
- `src/components/admin/UserTable.tsx` — user list with actions
- `src/components/admin/EditUserModal.tsx` — modal for editing other users
- `src/components/profile/AvatarUpload.tsx` — avatar upload component
- `src/lib/utils/roles.ts` — role check helpers (isAdmin, isDeveloper)
- `supabase/migrations/003_profiles_admin.sql` — DB changes

### Unchanged
- Auth flow, middleware, existing hooks
