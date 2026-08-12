import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/roles';
import type { UserRole } from '@/types/database';

/**
 * Má přihlášený člověk práva admina? Pro serverové stránky.
 *
 * `requireAdmin` vrací rovnou `NextResponse`, což se hodí do API rout, ale
 * ve stránce potřebujeme jen ano/ne a vykreslit místo dat hlášku. Kontrola
 * na klientovi tady nestačí: serverová komponenta si data načte dřív, než
 * se prohlížeč vůbec zeptá, kdo je přihlášený.
 */
export async function jeAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  return isAdmin(profile?.role as UserRole | undefined);
}
