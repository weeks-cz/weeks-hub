import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Verify @weeks.cz domain
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email?.endsWith('@weeks.cz')) {
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/auth/error?error=invalid_domain`
        );
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error?error=auth_failed`);
}
