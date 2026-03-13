import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// In-memory cache (5 minutes)
let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

function getAnalyticsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    return null;
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

export async function GET(request: Request) {
  try {
    // Verify auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check property ID
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
      return NextResponse.json(
        { error: 'GA4_PROPERTY_ID is not configured. Add it to your environment variables.' },
        { status: 503 }
      );
    }

    // Return cached data if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const client = getAnalyticsClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Google Analytics credentials are not configured. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.' },
        { status: 503 }
      );
    }

    const property = `properties/${propertyId}`;

    // Run all queries in parallel
    const [overviewCurrent, overviewPrevious, dailyVisitors, topPages, trafficSources, keyEvents] =
      await Promise.all([
        // Overview: last 7 days
        client.runReport({
          property,
          dateRanges: [{ startDate: getDaysAgo(7), endDate: 'today' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        }),
        // Overview: previous 7 days (for comparison)
        client.runReport({
          property,
          dateRanges: [{ startDate: getDaysAgo(14), endDate: getDaysAgo(8) }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        }),
        // Daily visitors: last 30 days
        client.runReport({
          property,
          dateRanges: [{ startDate: getDaysAgo(30), endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date', orderType: 'ALPHANUMERIC' } }],
        }),
        // Top pages
        client.runReport({
          property,
          dateRanges: [{ startDate: getDaysAgo(30), endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10,
        }),
        // Traffic sources
        client.runReport({
          property,
          dateRanges: [{ startDate: getDaysAgo(30), endDate: 'today' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
          limit: 8,
        }),
        // Key events
        client.runReport({
          property,
          dateRanges: [{ startDate: getDaysAgo(30), endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: [
                  'registration_click',
                  'interest_submit',
                  'waitlist_submit',
                  'view_oneday_camp',
                ],
              },
            },
          },
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        }),
      ]);

    // Parse overview
    const currentRow = overviewCurrent[0]?.rows?.[0];
    const previousRow = overviewPrevious[0]?.rows?.[0];

    const getMetric = (row: typeof currentRow, index: number): number => {
      return parseFloat(row?.metricValues?.[index]?.value || '0');
    };

    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const overview = {
      totalUsers: getMetric(currentRow, 0),
      totalPageviews: getMetric(currentRow, 1),
      avgSessionDuration: Math.round(getMetric(currentRow, 2)),
      bounceRate: Math.round(getMetric(currentRow, 3) * 100) / 100,
      changes: {
        users: calcChange(getMetric(currentRow, 0), getMetric(previousRow, 0)),
        pageviews: calcChange(getMetric(currentRow, 1), getMetric(previousRow, 1)),
        duration: calcChange(getMetric(currentRow, 2), getMetric(previousRow, 2)),
        bounceRate: calcChange(getMetric(currentRow, 3), getMetric(previousRow, 3)),
      },
    };

    // Parse daily visitors
    const dailyData = (dailyVisitors[0]?.rows || []).map((row) => {
      const dateStr = row.dimensionValues?.[0]?.value || '';
      const formatted = dateStr.length === 8
        ? `${dateStr.slice(6, 8)}.${dateStr.slice(4, 6)}.`
        : dateStr;
      return {
        date: formatted,
        users: parseInt(row.metricValues?.[0]?.value || '0', 10),
        pageviews: parseInt(row.metricValues?.[1]?.value || '0', 10),
      };
    });

    // Parse top pages
    const topPagesData = (topPages[0]?.rows || []).map((row) => ({
      page: row.dimensionValues?.[0]?.value || '',
      views: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }));

    // Parse traffic sources
    const trafficSourcesData = (trafficSources[0]?.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || '',
      users: parseInt(row.metricValues?.[0]?.value || '0', 10),
    }));

    // Parse key events
    const keyEventsData = (keyEvents[0]?.rows || []).map((row) => ({
      event: row.dimensionValues?.[0]?.value || '',
      count: parseInt(row.metricValues?.[0]?.value || '0', 10),
    }));

    const responseData = {
      overview,
      dailyVisitors: dailyData,
      topPages: topPagesData,
      trafficSources: trafficSourcesData,
      keyEvents: keyEventsData,
    };

    // Update cache
    cache = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
