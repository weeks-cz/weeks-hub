'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface MetaOverview {
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  changes: {
    spend: number;
    reach: number;
    impressions: number;
    clicks: number;
    cpc: number;
    ctr: number;
  };
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  startTime: string | null;
  stopTime: string | null;
}

export interface MetaDailySpend {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
}

export interface MetaCampaignsData {
  overview: MetaOverview;
  campaigns: MetaCampaign[];
  dailySpend: MetaDailySpend[];
}

export function useMetaCampaigns() {
  const [data, setData] = useState<MetaCampaignsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMetaCampaigns = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Nepřihlášen');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/meta-campaigns', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const body = await response.json();
        setError(body.error || 'Chyba při načítání Meta kampaní');
        setLoading(false);
        return;
      }

      const campaignsData = await response.json();
      setData(campaignsData);
      setError(null);
    } catch {
      setError('Nepodařilo se načíst data Meta kampaní');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetaCampaigns();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMetaCampaigns, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMetaCampaigns]);

  return { data, loading, error, refetch: fetchMetaCampaigns };
}
