# Weeks Hub - Claude Code Config

## Projekt
Interní team management systém pro organizaci Weeks (weeks.cz).
Kanban board, kalendář, dashboard, user profily s real-time aktualizacemi.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript + React 19
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide React ikony
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Drag & Drop:** @hello-pangea/dnd
- **Datum:** date-fns

## Architektura
- `src/app/(authenticated)/` - chráněné stránky (dashboard, board, calendar, profile)
- `src/app/auth/` - login, callback, error
- `src/components/` - 32 komponent (ui/, board/, calendar/, dashboard/, layout/, shared/)
- `src/hooks/` - custom hooks (useTasks, useEvents, useUsers, useActivityLog)
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

## Stav nasazení
- [x] Krok 1: Supabase projekt vytvořen
- [x] Krok 2: Env proměnné nastaveny
- [x] Krok 3: SQL migrace spuštěna
- [ ] Krok 4: Google OAuth nastavení (Google Cloud Console + Supabase Auth)
- [ ] Krok 5: Lokální testování
- [ ] Krok 6: Deploy na Vercel
- [ ] Krok 7: Custom doména app.weeks.cz
