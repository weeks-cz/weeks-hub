import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  // OAuth flow (Google)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
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

  // Magic link OTP flow
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!error) {
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

    return NextResponse.redirect(
      `${origin}/auth/error?error=magic_link_failed`
    );
  }

  return NextResponse.redirect(`${origin}/auth/error?error=auth_failed`);
}
