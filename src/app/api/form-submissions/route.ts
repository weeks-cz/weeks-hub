import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_PROGRAMS = ['mix', '3d-tisk', 'iot', 'blender', 'web', 'hry', 'csharp', 'nevim'];

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

    if (!form_type || !['waitlist', 'contact'].includes(form_type)) {
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
    } else {
      // contact
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
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
