# Weeks Hub - Claude Code Config

## Projekt
Interní team management systém pro organizaci Weeks (weeks.cz).
Kanban board (Asana-like), kalendář, dashboard, user profily, admin sekce, notifikace.
Google Analytics a Meta Ads přehledy přímo v aplikaci.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript + React 19
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide React ikony
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Drag & Drop:** @hello-pangea/dnd
- **Datum:** date-fns
- **Grafy:** Recharts (analytics dashboard)
- **Design:** Indigo palette (#6366F1), glassmorphism, gradients, decorative blobs — aligned with weeks.cz

## Architektura
- `src/app/(authenticated)/` - chráněné stránky (dashboard, board, calendar, profile, camps, formulare, analytics)
- `src/app/(authenticated)/admin/` - admin sekce (přehled, správa uživatelů) — viditelná jen pro admin/developer role
- `src/app/(authenticated)/layout.tsx` - **AuthGuard** pattern: blokuje obsah dokud se auth nerozhodne, při null session přesměruje na login
- `src/app/auth/` - login, callback, error
- `src/app/api/` - API routes:
  - `analytics/route.ts` - GA4 Data API proxy (server-side, cached)
  - `meta-campaigns/route.ts` - Meta Marketing API proxy (FB ad campaigns)
  - `form-submissions/route.ts` - sync formulářů z weeks.cz + notifikace adminům
  - `sync-camps/route.ts` - sync táborů z weeks.cz + enrollment notifikace
- `src/components/` - komponenty (ui/, board/, calendar/, dashboard/, layout/, shared/, analytics/, admin/, profile/)
- `src/components/board/` - TaskDetailPanel (slide-over drawer), CommentList, CommentInput, AttachmentList, FileUploadZone, SubtaskList
- `src/hooks/` - custom hooks:
  - `useTasks` - kanban úkoly s drag&drop, child tasks (nested subtasks), subtask CRUD
  - `useTaskComments` - komentáře s realtime a @mention notifikacemi
  - `useTaskAttachments` - přílohy přes Supabase Storage
  - `useNotifications` - in-app notifikace s realtime subscription
  - `useEvents` - kalendářní události
  - `useUsers` - uživatelské profily
  - `useActivityLog` - log aktivit
  - `useCamps` - tábory
  - `useFormSubmissions` - formulářové submise
  - `useAnalytics` - GA4 data (visitors, pageviews, sources, key events)
  - `useMetaCampaigns` - Meta/FB campaign data (spend, reach, clicks, CPC, CTR)
- `src/lib/supabase/` - Supabase klienti (client.ts browser, server.ts SSR, middleware.ts)
- `src/lib/utils/roles.ts` - role helpers (isAdmin, isDeveloper, canManageRoles, canDeleteUsers)
- `src/contexts/AuthContext.tsx` - auth provider s useAuth() hookem
- `src/types/database.ts` - TypeScript typy a enumy
- `src/middleware.ts` - route protection (přesměrování neautorizovaných)
- `supabase/migrations/` - DB migrace (001-008)

## Databáze (Supabase PostgreSQL)
Tabulky: users, tasks, subtasks, labels, task_labels, calendar_events, event_attendees, activity_log, notifications, task_comments, task_attachments
- RLS policies omezují přístup na @weeks.cz doménu
- Realtime subscriptions na tasks, subtasks, calendar_events, activity_log, notifications, task_comments
- Funkce `is_weeks_user()` kontroluje emailovou doménu (čte z JWT, ne z tabulky)
- **3 role:** developer (plný přístup), admin (správa táborů/formulářů/profilů), member (vlastní profil)
- **Nested subtasks:** Tasks mají `parent_task_id` — subtasky jsou plnohodnotné tasky s vlastními komentáři, přílohami atd.
- Supabase Storage buckety: `avatars` (profilové fotky), `attachments` (task přílohy)

## Role systém
- `developer` — vše (role, mazání uživatelů, audit log, nastavení). Lukáš Kubík (lukas.kubik@weeks.cz)
- `admin` — správa táborů, formulářů, editace profilů ostatních. Nemůže měnit role, mazat uživatele
- `member` — editace vlastního profilu
- Role check helpers v `src/lib/utils/roles.ts`
- Admin link v sidebaru podmíněn `isAdmin(user.role)`

## Auth
- Google OAuth přes Supabase Auth
- Omezeno na @weeks.cz emaily (middleware + RLS)
- Auto-vytvoření profilu při prvním přihlášení (DB trigger)
- **AuthGuard** v authenticated layout blokuje render dokud auth stav není resolved
- **DŮLEŽITÉ:** V `onAuthStateChange` callbacku NIKDY nevolat Supabase queries (způsobuje deadlock). Profil fetchovat v separátním useEffect.

## Board (Asana-like)
- **TaskDetailPanel** — slide-over drawer zprava (ne modal), s inline editací všech polí
- **Nested subtasks** — subtasky jsou reálné tasky s `parent_task_id`. Board zobrazuje jen top-level (parent_task_id IS NULL). Klik na subtask naviguje do jeho detailu s breadcrumb navigací zpět
- **Komentáře** — realtime, @mention notifikace, edit/delete vlastních
- **Přílohy** — drag-drop upload do Supabase Storage bucket `attachments`
- **URL state** — `/board?task={id}` pro deep linking
- **Legacy subtasks** (tabulka `subtasks`) stále podporovány jako checklist

## Env proměnné (.env.local)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Google Analytics (GA4 Data API)
GOOGLE_CLIENT_EMAIL=...          # service account email
GOOGLE_PRIVATE_KEY=...           # service account private key (PEM)
GA4_PROPERTY_ID=...              # GA4 property ID (číslo)

# Meta Marketing API
META_ACCESS_TOKEN=...            # long-lived user token (60 dní, expiry ~May 12, 2026)
META_AD_ACCOUNT_ID=...           # act_XXXXXXXXX
```
**POZOR:** env vars nesmí mít trailing newline (`\n`) — způsobí auth chyby.

## Konvence
- Jazyk UI: čeština
- Jazyk kódu/komentářů: angličtina
- Path aliasy: `@/*` → `./src/*`
- Soubor `.env.local` NIKDY necommitovat
- Uživatel preferuje deploy rovnou na main (push = Vercel deploy)

## Důležité příkazy
```bash
npm run dev      # lokální vývoj (http://localhost:3000)
npm run build    # produkční build (selže bez env vars — OK pro TypeScript check)
npm run lint     # ESLint kontrola
npx tsc --noEmit # TypeScript check (preferovaný způsob ověření před push)
```

## Known issues & gotchas
- **Drag & drop reorder:** `moveTask` musí přeřadit pozice VŠECH úkolů v dotčených sloupcích, jinak vznikne "teleport" bug
- **Realtime suppression:** Při drag&drop se dočasně potlačí realtime subscription aby nedošlo ke konfliktu
- **Meta API:** Instagram boost kampaně nejsou přístupné přes Marketing API — dashboard zobrazuje pouze FB kampaně
- **Meta token:** Vyprší po 60 dnech, nutno obnovit. Aktuální expiry ~May 12, 2026.
- **Supabase Storage RLS:** `is_weeks_user()` nefunguje v storage kontextu — použít `auth.role() = 'authenticated'`
- **RLS tasks UPDATE:** Policy musí být `is_weeks_user()` (ne `assignee_id OR created_by`), jinak tým nemůže přesouvat/editovat cizí tasky
- **Camp sync status:** Status se odvozuje z dat (registrationUrl → open_with_link, capacity full → full), ne z raw API
- **Weeks.cz camp data:** Hardcoded v `weeks_web/src/app/api/camps/route.ts` — DDM ID a registrationUrl se musí ručně aktualizovat
- **LabelSelect dropdown:** Nesmí být absolute positioned (bottom-full/top-full) — způsobuje overflow bugy. Použít statický element
- **Migrace:** Spouštějí se ručně v Supabase SQL Editoru. Aktuální: 001-008
- **npm run build:** Selže bez Supabase env vars (prerendering) — pro kontrolu použít `npx tsc --noEmit`
- **🐛 BUG: Subtask navigace nefunguje** — kliknutí na child task v TaskDetailPanel neotevře jeho detail. Problém je v `onNavigateToTask` handleru v KanbanBoard — nastavení `selectedTaskId` na child task ID nepřepne panel. Potřebuje debug: zkontrolovat zda child task existuje v `tasks` poli, zda se `selectedTask` správně resolvuje, a zda panel reaguje na změnu tasku

## Stav nasazení
- [x] Supabase projekt + Custom doména app.weeks.cz
- [x] Deploy na Vercel + Google OAuth
- [x] Design aligned s weeks.cz (indigo palette, logo, glassmorphism)
- [x] Dashboard bento grid layout
- [x] Board redesign (Asana-like: task detail panel, komentáře, přílohy, nested subtasky)
- [x] Rozšířené profily (pozice, telefon, fun fields, avatar upload)
- [x] Role systém (developer/admin/member) + Admin sekce
- [x] In-app notifikace (bell icon, task assignment, form submissions, camp enrollment)
- [x] Google Analytics + Meta campaigns dashboards
