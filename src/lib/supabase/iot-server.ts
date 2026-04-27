import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client for weeks-iot Supabase project.
 * Server-only — never import in client components. Bypasses RLS.
 */
export function createIotAdminClient() {
  return createSupabaseClient(
    process.env.WEEKS_IOT_SUPABASE_URL!,
    process.env.WEEKS_IOT_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
