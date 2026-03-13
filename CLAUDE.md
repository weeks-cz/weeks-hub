# Weeks Hub - Claude Code Config

## Projekt
Interní team management systém pro organizaci Weeks (weeks.cz).
Kanban board, kalendář, dashboard, user profily s real-time aktualizacemi.
Google Analytics a Meta Ads přehledy přímo v aplikaci.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript + React 19
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide React ikony
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Drag & Drop:** @hello-pangea/dnd
- **Datum:** date-fns
- **Grafy:** Recharts (analytics dashboard)
- **Design:** Indigo palette (#6366F1), glassmorphism, gradients, decorative blobs — aligned with weeks.cz

## Architektura
- `src/app/(authenticated)/` - chráněné stránky (dashboard, board, calendar, profile, camps, formulare, analytics)
- `src/app/(authenticated)/layout.tsx` - **AuthGuard** pattern: blokuje obsah dokud se auth nerozhodne, při null session přesměruje na login
- `src/app/auth/` - login, callback, error
- `src/app/api/` - API routes:
  - `analytics/route.ts` - GA4 Data API proxy (server-side, cached)
  - `meta-campaigns/route.ts` - Meta Marketing API proxy (FB ad campaigns)
  - `form-submissions/route.ts` - sync formulářů z weeks.cz
  - `sync-camps/route.ts` - sync táborů z weeks.cz
- `src/components/` - komponenty (ui/, board/, calendar/, dashboard/, layout/, shared/, analytics/)
- `src/hooks/` - custom hooks:
  - `useTasks` - kanban úkoly s drag&drop
  - `useEvents` - kalendářní události
  - `useUsers` - uživatelské profily
  - `useActivityLog` - log aktivit
  - `useCamps` - tábory
  - `useFormSubmissions` - formulářové submise
  - `useAnalytics` - GA4 data (visitors, pageviews, sources, key events)
  - `useMetaCampaigns` - Meta/FB campaign data (spend, reach, clicks, CPC, CTR)
- `src/lib/supabase/` - Supabase klienti (client.ts browser, server.ts SSR, middleware.ts)
- `src/contexts/AuthContext.tsx` - auth provider s useAuth() hookem
- `src/types/database.ts` - TypeScript typy a enumy
- `src/middleware.ts` - route protection (přesměrování neautorizovaných)
- `supabase/migrations/001_initial_schema.sql` - kompletní DB schema

## Databáze (Supabase PostgreSQL)
Tabulky: users, tasks, subtasks, labels, task_labels, calendar_events, event_attendees, activity_log
- RLS policies omezují přístup na @weeks.cz doménu
- Realtime subscriptions na tasks, subtasks, calendar_events, activity_log
- Funkce `is_weeks_user()` kontroluje emailovou doménu

## Auth
- Google OAuth přes Supabase Auth
- Omezeno na @weeks.cz emaily (middleware + RLS)
- Auto-vytvoření profilu při prvním přihlášení (DB trigger)
- **AuthGuard** v authenticated layout blokuje render dokud auth stav není resolved
- **DŮLEŽITÉ:** V `onAuthStateChange` callbacku NIKDY nevolat Supabase queries (způsobuje deadlock). Profil fetchovat v separátním useEffect.

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

## Důležité příkazy
```bash
npm run dev      # lokální vývoj (http://localhost:3000)
npm run build    # produkční build
npm run lint     # ESLint kontrola
```

## Known issues & gotchas
- **Drag & drop reorder:** `moveTask` musí přeřadit pozice VŠECH úkolů v dotčených sloupcích, jinak vznikne "teleport" bug
- **Realtime suppression:** Při drag&drop se dočasně potlačí realtime subscription aby nedošlo ke konfliktu
- **Meta API:** Instagram boost kampaně nejsou přístupné přes Marketing API — dashboard zobrazuje pouze FB kampaně
- **Meta token:** Vyprší po 60 dnech, nutno obnovit. Aktuální expiry ~May 12, 2026.

## Stav nasazení
- [x] Supabase projekt
- [x] Env proměnné
- [x] SQL migrace
- [x] Google OAuth
- [x] Deploy na Vercel
- [x] Custom doména app.weeks.cz
- [x] Design aligned s weeks.cz (indigo palette, logo, glassmorphism)
- [x] Google Analytics dashboard
- [x] Meta campaigns dashboard
