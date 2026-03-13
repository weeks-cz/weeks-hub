import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// In-memory cache (5 minutes)
let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

const META_BASE_URL = 'https://graph.facebook.com/v21.0';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

interface MetaInsightRow {
  impressions?: string;
  reach?: string;
  clicks?: string;
  spend?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  actions?: Array<{ action_type: string; value: string }>;
  date_start?: string;
  date_stop?: string;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  start_time?: string;
  stop_time?: string;
}

async function metaFetch(path: string, accessToken: string): Promise<unknown> {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${META_BASE_URL}/${path}${separator}access_token=${accessToken}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Meta API error ${response.status}: ${JSON.stringify(errorBody)}`
    );
  }
  return response.json();
}

function parseInsightRow(row: MetaInsightRow) {
  return {
    impressions: parseInt(row.impressions || '0', 10),
    reach: parseInt(row.reach || '0', 10),
    clicks: parseInt(row.clicks || '0', 10),
    spend: parseFloat(row.spend || '0'),
    cpc: parseFloat(row.cpc || '0'),
    cpm: parseFloat(row.cpm || '0'),
    ctr: parseFloat(row.ctr || '0'),
  };
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
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

    // Check env vars
    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        { error: 'META_ACCESS_TOKEN a META_AD_ACCOUNT_ID nejsou nakonfigurovány. Přidejte je do proměnných prostředí.' },
        { status: 503 }
      );
    }

    // Return cached data if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const now = new Date();
    const last7Start = formatDate(getDaysAgo(7));
    const last7End = formatDate(now);
    const prev7Start = formatDate(getDaysAgo(14));
    const prev7End = formatDate(getDaysAgo(8));
    const last30Start = formatDate(getDaysAgo(30));

    // Run all queries in parallel
    const [
      campaignsResult,
      overviewCurrentResult,
      overviewPreviousResult,
      dailyResult,
    ] = await Promise.all([
      // All campaigns
      metaFetch(
        `${adAccountId}/campaigns?fields=name,status,objective,start_time,stop_time&limit=100`,
        accessToken
      ) as Promise<{ data: MetaCampaign[] }>,
      // Account overview: last 7 days
      metaFetch(
        `${adAccountId}/insights?fields=impressions,reach,clicks,spend,cpc,cpm,ctr&time_range=${encodeURIComponent(JSON.stringify({ since: last7Start, until: last7End }))}`,
        accessToken
      ) as Promise<{ data: MetaInsightRow[] }>,
      // Account overview: previous 7 days
      metaFetch(
        `${adAccountId}/insights?fields=impressions,reach,clicks,spend,cpc,cpm,ctr&time_range=${encodeURIComponent(JSON.stringify({ since: prev7Start, until: prev7End }))}`,
        accessToken
      ) as Promise<{ data: MetaInsightRow[] }>,
      // Daily breakdown: last 30 days
      metaFetch(
        `${adAccountId}/insights?fields=impressions,clicks,spend&time_range=${encodeURIComponent(JSON.stringify({ since: last30Start, until: last7End }))}&time_increment=1`,
        accessToken
      ) as Promise<{ data: MetaInsightRow[] }>,
    ]);

    // Fetch insights for each campaign (lifetime)
    const campaigns = campaignsResult.data || [];
    const campaignInsights = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          const insightResult = await metaFetch(
            `${campaign.id}/insights?fields=impressions,reach,clicks,spend,cpc,ctr&date_preset=maximum`,
            accessToken
          ) as { data: MetaInsightRow[] };
          const row = insightResult.data?.[0];
          const metrics = row ? parseInsightRow(row) : { impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, cpm: 0, ctr: 0 };
          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective || '',
            spend: metrics.spend,
            reach: metrics.reach,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            cpc: metrics.cpc,
            ctr: metrics.ctr,
            startTime: campaign.start_time || null,
            stopTime: campaign.stop_time || null,
          };
        } catch {
          // If individual campaign insight fails, return zeros
          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective || '',
            spend: 0,
            reach: 0,
            impressions: 0,
            clicks: 0,
            cpc: 0,
            ctr: 0,
            startTime: campaign.start_time || null,
            stopTime: campaign.stop_time || null,
          };
        }
      })
    );

    // Sort campaigns by spend descending
    campaignInsights.sort((a, b) => b.spend - a.spend);

    // Parse overview
    const currentMetrics = overviewCurrentResult.data?.[0]
      ? parseInsightRow(overviewCurrentResult.data[0])
      : { impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, cpm: 0, ctr: 0 };
    const previousMetrics = overviewPreviousResult.data?.[0]
      ? parseInsightRow(overviewPreviousResult.data[0])
      : { impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, cpm: 0, ctr: 0 };

    const overview = {
      spend: currentMetrics.spend,
      reach: currentMetrics.reach,
      impressions: currentMetrics.impressions,
      clicks: currentMetrics.clicks,
      cpc: currentMetrics.cpc,
      cpm: currentMetrics.cpm,
      ctr: currentMetrics.ctr,
      changes: {
        spend: calcChange(currentMetrics.spend, previousMetrics.spend),
        reach: calcChange(currentMetrics.reach, previousMetrics.reach),
        impressions: calcChange(currentMetrics.impressions, previousMetrics.impressions),
        clicks: calcChange(currentMetrics.clicks, previousMetrics.clicks),
        cpc: calcChange(currentMetrics.cpc, previousMetrics.cpc),
        ctr: calcChange(currentMetrics.ctr, previousMetrics.ctr),
      },
    };

    // Parse daily spend
    const dailySpend = (dailyResult.data || []).map((row) => {
      const dateStr = row.date_start || '';
      // Format from YYYY-MM-DD to DD.MM.
      const parts = dateStr.split('-');
      const formatted = parts.length === 3 ? `${parts[2]}.${parts[1]}.` : dateStr;
      return {
        date: formatted,
        spend: parseFloat(row.spend || '0'),
        impressions: parseInt(row.impressions || '0', 10),
        clicks: parseInt(row.clicks || '0', 10),
      };
    });

    const responseData = {
      overview,
      campaigns: campaignInsights,
      dailySpend,
    };

    // Update cache
    cache = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Meta Campaigns API error:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se načíst data z Meta API' },
      { status: 500 }
    );
  }
}
