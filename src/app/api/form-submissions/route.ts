import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_PROGRAMS = ['mix', 'mix-leto', '3d-tisk', 'iot', 'blender', 'web', 'hry', 'csharp', 'nevim'];
const VALID_PRODUCT_TYPES = ['set', 'upgrade-kit', 'project'];

export async function POST(request: NextRequest) {
  // Verify API key
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.FORM_SUBMISSIONS_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role client to bypass RLS (no user session for this public endpoint)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    const { form_type } = body;

    if (!form_type || !['waitlist', 'contact', 'shop_interest'].includes(form_type)) {
      return NextResponse.json({ error: 'Invalid form_type' }, { status: 400 });
    }

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (form_type === 'waitlist') {
      if (!body.program || !VALID_PROGRAMS.includes(body.program)) {
        return NextResponse.json({ error: 'Invalid program' }, { status: 400 });
      }

      const { error } = await supabase.from('form_submissions').insert({
        form_type: 'waitlist',
        email: body.email,
        child_name: body.child_name || null,
        child_age: body.child_age || null,
        program: body.program,
        gdpr_consent: body.gdpr_consent ?? null,
      });

      if (error) {
        console.error('Form submission insert error:', error);
        return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
      }
    } else if (form_type === 'contact') {
      if (!body.sender_name || !body.message) {
        return NextResponse.json({ error: 'Name and message are required for contact form' }, { status: 400 });
      }

      const { error } = await supabase.from('form_submissions').insert({
        form_type: 'contact',
        email: body.email,
        sender_name: body.sender_name,
        message: body.message,
      });

      if (error) {
        console.error('Form submission insert error:', error);
        return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
      }
    } else {
      // shop_interest
      if (!body.product_slug || !body.product_name || !body.product_type || !VALID_PRODUCT_TYPES.includes(body.product_type)) {
        return NextResponse.json({ error: 'Invalid product interest payload' }, { status: 400 });
      }

      const { error } = await supabase.from('form_submissions').insert({
        form_type: 'shop_interest',
        email: body.email,
        sender_name: body.sender_name || null,
        message: body.message || null,
        gdpr_consent: body.gdpr_consent ?? null,
        product_slug: body.product_slug,
        product_name: body.product_name,
        product_type: body.product_type,
      });

      if (error) {
        console.error('Form submission insert error:', error);
        return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
      }
    }

    // Notify admins/developers about new submission
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .in('role', ['admin', 'developer']);

    if (admins && admins.length > 0) {
      const typeLabel = form_type === 'waitlist' ? 'Waitlist' : form_type === 'contact' ? 'Kontakt' : 'E-shop zájem';
      await supabase.from('notifications').insert(
        admins.map((admin) => ({
          user_id: admin.id,
          type: 'new_submission',
          title: `Nový formulář: ${typeLabel}`,
          message: `${body.email} odeslal/a ${typeLabel.toLowerCase()} formulář`,
          link: '/formulare',
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
