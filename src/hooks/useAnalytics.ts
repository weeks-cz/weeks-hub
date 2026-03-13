'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AnalyticsOverview {
  totalUsers: number;
  totalPageviews: number;
  avgSessionDuration: number;
  bounceRate: number;
  changes: {
    users: number;
    pageviews: number;
    duration: number;
    bounceRate: number;
  };
}

export interface DailyVisitor {
  date: string;
  users: number;
  pageviews: number;
}

export interface TopPage {
  page: string;
  views: number;
  users: number;
}

export interface TrafficSource {
  source: string;
  users: number;
}

export interface KeyEvent {
  event: string;
  count: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  dailyVisitors: DailyVisitor[];
  topPages: TopPage[];
  trafficSources: TrafficSource[];
  keyEvents: KeyEvent[];
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Nepřihlášen');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/analytics', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const body = await response.json();
        setError(body.error || 'Chyba při načítání analytiky');
        setLoading(false);
        return;
      }

      const analyticsData = await response.json();
      setData(analyticsData);
      setError(null);
    } catch {
      setError('Nepodařilo se načíst analytická data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  return { data, loading, error, refetch: fetchAnalytics };
}
