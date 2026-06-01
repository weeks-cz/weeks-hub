import { createClient } from '@supabase/supabase-js';

// Service-role klient — obchází RLS. POUZE pro server (API routes), NIKDY pro klienta.
// Čte sdílenou tabulku `registrations`, na které není SELECT RLS policy (migrace 012).
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
