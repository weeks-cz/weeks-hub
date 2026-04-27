# Weeks Hub - Setup Guide

## Co je hotové

Celý projekt je implementovaný a build prochází (`npm run build`).

### Soubory a struktura
- 60 zdrojových souborů v `src/`
- 1 SQL migrace v `supabase/migrations/`
- `.env.local` s reálnými Supabase credentials (NIKDY NECOMMITOVAT)

### Env proměnné (v `.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://qtxiwtinwcagsyhwaeda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Postup nasazení - krok po kroku

### KROK 1: Supabase projekt ✅ HOTOVO
- Projekt vytvořen na supabase.com
- Region: Europe (Frankfurt)
- URL: `https://qtxiwtinwcagsyhwaeda.supabase.co`

### KROK 2: Env proměnné ✅ HOTOVO
- `.env.local` aktualizován s reálnými hodnotami

### KROK 3: SQL migrace ⬜ UDĚLAT
1. Jdi do Supabase dashboard → **SQL Editor** (ikona `>_` v levém menu)
2. Klikni **"New query"**
3. Vlož celý obsah souboru `supabase/migrations/001_initial_schema.sql`
4. Klikni **"Run"** (nebo Ctrl+Enter)
5. Mělo by se zobrazit "Success. No rows returned" - to je OK

### KROK 4: Google OAuth nastavení ⬜ UDĚLAT

#### 4a) Google Cloud Console
1. Jdi na https://console.cloud.google.com/
2. Vytvoř nový projekt (nebo použij existující pro Weeks)
3. Jdi do **APIs & Services → OAuth consent screen**
   - User Type: External (nebo Internal pokud máš Google Workspace)
   - App name: "Weeks Hub"
   - Support email: tvůj @weeks.cz email
   - Authorized domains: `weeks.cz`, `supabase.co`
4. Jdi do **APIs & Services → Credentials**
5. Klikni **"Create Credentials" → "OAuth 2.0 Client ID"**
   - Application type: Web application
   - Name: "Weeks Hub"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://app.weeks.cz`
   - Authorized redirect URIs:
     - `https://qtxiwtinwcagsyhwaeda.supabase.co/auth/v1/callback`
6. Zapiš si **Client ID** a **Client Secret**

#### 4b) Supabase Auth nastavení
1. V Supabase dashboard jdi do **Authentication → Providers**
2. Najdi **Google** a klikni na něj
3. Zapni **Enable Google provider**
4. Vlož **Client ID** a **Client Secret** z Google Cloud Console
5. Ulož

### KROK 5: Lokální testování ⬜ UDĚLAT
```bash
cd weeks-hub
npm run dev
```
- Otevři http://localhost:3000
- Přesměruje na /auth/login
- Klikni "Přihlásit se přes Google"
- Přihlas se @weeks.cz účtem

### KROK 6: Deploy na Vercel ⬜ UDĚLAT
1. Jdi na https://vercel.com a přihlas se
2. Klikni **"Add New Project"**
3. Importuj `weeks-hub` repo z GitHubu (musíš ho tam nejdřív pushnout)
   ```bash
   cd weeks-hub
   git add -A
   git commit -m "Initial commit - Weeks Hub"
   git remote add origin https://github.com/TVUJ-USERNAME/weeks-hub.git
   git push -u origin main
   ```
4. Ve Vercelu nastav **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://qtxiwtinwcagsyhwaeda.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (celý JWT token)
5. Klikni **Deploy**

### KROK 7: Custom doména app.weeks.cz ⬜ UDĚLAT
1. Ve Vercelu v nastavení projektu → **Domains** → přidej `app.weeks.cz`
2. Na subreg.cz přidej DNS záznam:
   ```
   Typ: CNAME
   Název: app
   Hodnota: cname.vercel-dns.com
   ```
3. Počkej na propagaci DNS (max pár hodin)
4. V Google Cloud Console přidej `https://app.weeks.cz` do Authorized JavaScript origins
5. V Supabase → Authentication → URL Configuration:
   - Site URL: `https://app.weeks.cz`
   - Redirect URLs: přidej `https://app.weeks.cz/auth/callback`

---

## Weeks-iot Supabase (learning stats)

Add to `.env.local` (never commit):

```
WEEKS_IOT_SUPABASE_URL=https://izrskvooxsdyzwqrwhev.supabase.co
WEEKS_IOT_SUPABASE_SERVICE_ROLE_KEY=<service_role key from Supabase dashboard>
```

Used by `/admin/learning` and `/admin/learning/users` to read learning stats
from the weeks-iot project via service-role (bypasses RLS).

---

## Technologie
- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Supabase (PostgreSQL, Auth, Realtime)
- Framer Motion, Lucide React, @hello-pangea/dnd, date-fns

## Důležité soubory
- `src/middleware.ts` - route protection
- `src/lib/supabase/` - Supabase klient (browser + server)
- `src/contexts/AuthContext.tsx` - auth provider
- `supabase/migrations/001_initial_schema.sql` - databázové schema
- `.env.local` - credentials (NIKDY NECOMMITOVAT!)
