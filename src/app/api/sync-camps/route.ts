import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface WebCamp {
  id: string;
  title: string;
  campType: 'weekend' | 'oneday';
  program: string;
  startDate: string;
  endDate: string;
  location: string;
  locationDetail: string;
  capacity: number;
  spotsLeft: number | null;
  enrolledCount: number | null;
  status: string;
  registrationUrl: string | null;
  price: number;
  ddmId: string | null;
}

export async function POST(request: Request) {
  try {
    // Verify auth - get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch camps from weeks.cz API
    const response = await fetch('https://weeks.cz/api/camps', {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from weeks.cz: ${response.status}` },
        { status: 502 }
      );
    }

    const { camps: webCamps } = (await response.json()) as { camps: WebCamp[] };

    // Use supabase with auth token from the request
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get existing camps from DB to check for duplicates (match by web_id)
    const { data: existingCamps } = await supabase
      .from('camps')
      .select('id, title, start_date, end_date, web_source_id');

    const existingByWebId = new Map(
      (existingCamps || [])
        .filter((c: { web_source_id?: string }) => c.web_source_id)
        .map((c: { web_source_id: string; id: string }) => [c.web_source_id, c.id])
    );

    // Also match by title + start_date for camps created before sync was added
    const existingByKey = new Map(
      (existingCamps || []).map((c: { title: string; start_date: string; id: string }) => [
        `${c.title}::${c.start_date}`,
        c.id,
      ])
    );

    // Get existing reminder events to avoid duplicates
    const { data: existingReminders } = await supabase
      .from('calendar_events')
      .select('id, description')
      .eq('event_type', 'reminder')
      .like('description', 'camp-reminder:%');

    const existingReminderCampIds = new Set(
      (existingReminders || [])
        .map((r: { description: string }) => r.description?.replace('camp-reminder:', ''))
        .filter(Boolean)
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let remindersCreated = 0;

    for (const webCamp of webCamps) {
      const enrolledCount = webCamp.enrolledCount ?? 0;
      const locationFull = webCamp.locationDetail
        ? `${webCamp.location}, ${webCamp.locationDetail}`
        : webCamp.location;

      const campData = {
        title: webCamp.title,
        description: `${webCamp.program.toUpperCase()} | ${webCamp.campType === 'weekend' ? 'Víkendový' : 'Jednodenní'} | ${webCamp.price} Kč`,
        start_date: webCamp.startDate,
        end_date: webCamp.endDate,
        location: locationFull,
        capacity: webCamp.capacity,
        enrolled_count: enrolledCount,
        status: webCamp.status,
        registration_url: webCamp.registrationUrl,
        web_source_id: webCamp.id,
      };

      // Check if already exists
      const existingId = existingByWebId.get(webCamp.id)
        || existingByKey.get(`${webCamp.title}::${webCamp.startDate}`);

      if (existingId) {
        // Update existing camp with fresh data
        const { error } = await supabase
          .from('camps')
          .update({
            enrolled_count: enrolledCount,
            status: webCamp.status,
            registration_url: webCamp.registrationUrl,
            capacity: webCamp.capacity,
            web_source_id: webCamp.id,
          })
          .eq('id', existingId);

        if (!error) updated++;
        else skipped++;
      } else {
        // Create new camp
        const { error } = await supabase
          .from('camps')
          .insert({
            ...campData,
            color: webCamp.program === '3d-tisk' ? '#8B5CF6'
              : webCamp.program === 'iot' ? '#06B6D4'
              : '#10B981',
            created_by: user.id,
          });

        if (!error) created++;
        else skipped++;
      }

      // Create reminder event 14 days before camp for "collecting_interest" camps
      if (webCamp.status === 'collecting_interest' && !existingReminderCampIds.has(webCamp.id)) {
        const campStart = new Date(webCamp.startDate);
        const reminderDate = new Date(campStart);
        reminderDate.setDate(reminderDate.getDate() - 14);

        // Only create if reminder date is in the future
        if (reminderDate > new Date()) {
          const reminderDateStr = reminderDate.toISOString().split('T')[0];
          const { error: reminderError } = await supabase
            .from('calendar_events')
            .insert({
              title: `Upomenout rodice: ${webCamp.title} (${webCamp.startDate})`,
              description: `camp-reminder:${webCamp.id}`,
              event_type: 'reminder',
              start_date: `${reminderDateStr}T09:00:00`,
              end_date: `${reminderDateStr}T09:00:00`,
              all_day: true,
              color: '#F59E0B',
              created_by: user.id,
            });

          if (!reminderError) remindersCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      remindersCreated,
      total: webCamps.length,
    });
  } catch (error) {
    console.error('Sync camps error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
