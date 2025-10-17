import React, { useEffect, useState } from 'react';
import { Calendar, Target, Bookmark, LucideIcon } from 'lucide-react';
import MetricCard from './MetricCard';
import { apiService } from '../services/api';
import { useCompany } from '../contexts/CompanyContext';

const DashboardOverview: React.FC = () => {
  const { company, refreshCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState<{ views: number; clicks: number; shares: number; ctr: number | null } | null>(null);
  const [viewsBreakdown, setViewsBreakdown] = useState<{ daily: number | null; weekly: number | null; monthly: number | null }>({ daily: null, weekly: null, monthly: null });
  const [clicksBreakdown, setClicksBreakdown] = useState<{ daily: number | null; weekly: number | null; monthly: number | null }>({ daily: null, weekly: null, monthly: null });
  const [savesBreakdown, setSavesBreakdown] = useState<{ daily: number | null; weekly: number | null; monthly: number | null }>({ daily: null, weekly: null, monthly: null });
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [trend, setTrend] = useState<{ views?: number; clicks?: number; favorites?: number; ctr?: number | null }>({});

  useEffect(() => {
    const load = async () => {
      if (!company) {
        await refreshCompany();
      }
      const c = company || null;
      if (!c?.id) return;
      try {
        setLoading(true);
        const now = new Date();
        const from = new Date(Date.now() - (range === '7d' ? 7 : range === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000);
        const res = await apiService.companyAnalyticsTotals({ company_id: c.id, from: from.toISOString(), to: now.toISOString() });
        const t = res.totals;
        setTotals({
          views: t.total_views || 0,
          clicks: t.total_clicks || 0,
          shares: t.total_shares || 0,
          ctr: t.ctr ?? null,
        });
        // previous period for trend
        const prevTo = from;
        const prevFrom = new Date(prevTo.getTime() - (now.getTime() - from.getTime()));
        const prev = await apiService.companyAnalyticsTotals({ company_id: c.id, from: prevFrom.toISOString(), to: prevTo.toISOString() });
        setTrend({
          views: prev?.totals?.total_views ?? 0,
          clicks: prev?.totals?.total_clicks ?? 0,
          favorites: prev?.totals?.total_favorites ?? 0,
          ctr: prev?.totals?.ctr ?? null,
        });
        // Fetch breakdowns in parallel
        const nowIso = now.toISOString();
        const fromDailyIso = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
        const fromWeeklyIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const fromMonthlyIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const [d, w, m] = await Promise.all([
          apiService.companyAnalyticsTotals({ company_id: c.id, from: fromDailyIso, to: nowIso }),
          apiService.companyAnalyticsTotals({ company_id: c.id, from: fromWeeklyIso, to: nowIso }),
          apiService.companyAnalyticsTotals({ company_id: c.id, from: fromMonthlyIso, to: nowIso })
        ]);
        setViewsBreakdown({
          daily: d?.totals?.total_views ?? 0,
          weekly: w?.totals?.total_views ?? 0,
          monthly: m?.totals?.total_views ?? 0,
        });
        setClicksBreakdown({
          daily: d?.totals?.total_clicks ?? 0,
          weekly: w?.totals?.total_clicks ?? 0,
          monthly: m?.totals?.total_clicks ?? 0,
        });
        setSavesBreakdown({
          daily: d?.totals?.total_favorites ?? 0,
          weekly: w?.totals?.total_favorites ?? 0,
          monthly: m?.totals?.total_favorites ?? 0,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, range]);

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
    return String(n);
  };

  const metrics: Array<{
    title: string;
    value: string;
    badge?: string;
    badgeColor?: string;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    breakdown: {
      daily: string;
      weekly: string;
      monthly: string;
    };
    description?: string;
    rangeLabel?: string;
    trendPercent?: number | null;
    trendLabel?: string;
  }> = [
    {
      title: 'ნახვები',
      value: totals ? formatNumber(totals.views) : (loading ? '...' : '0'),
      // badge removed per request
      icon: Calendar,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      description: 'Total views on your offers across the selected period',
      rangeLabel: range === '7d' ? 'ბოლო 7 დღე' : range === '30d' ? 'ბოლო 30 დღე' : 'ბოლო 90 დღე',
      breakdown: {
        daily: viewsBreakdown.daily !== null ? formatNumber(viewsBreakdown.daily) : (loading ? '...' : '-'),
        weekly: viewsBreakdown.weekly !== null ? formatNumber(viewsBreakdown.weekly) : (loading ? '...' : '-'),
        monthly: viewsBreakdown.monthly !== null ? formatNumber(viewsBreakdown.monthly) : (loading ? '...' : '-')
      },
      trendPercent: totals && trend.views !== undefined ? ((totals.views - (trend.views || 0)) / Math.max(trend.views || 0, 1)) * 100 : null,
      trendLabel: 'წინა პერიოდთან'
    },
    {
      title: 'კლიკები',
      value: totals ? formatNumber(totals.clicks) : (loading ? '...' : '0'),
      icon: Target,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      description: 'Total clicks on your offers (engagement)',
      rangeLabel: range === '7d' ? 'ბოლო 7 დღე' : range === '30d' ? 'ბოლო 30 დღე' : 'ბოლო 90 დღე',
      breakdown: {
        daily: clicksBreakdown.daily !== null ? formatNumber(clicksBreakdown.daily) : (loading ? '...' : '-'),
        weekly: clicksBreakdown.weekly !== null ? formatNumber(clicksBreakdown.weekly) : (loading ? '...' : '-'),
        monthly: clicksBreakdown.monthly !== null ? formatNumber(clicksBreakdown.monthly) : (loading ? '...' : '-')
      },
      trendPercent: totals && trend.clicks !== undefined ? ((totals.clicks - (trend.clicks || 0)) / Math.max(trend.clicks || 0, 1)) * 100 : null,
      trendLabel: 'წინა პერიოდთან'
    },
    {
      title: 'CTR',
      value: totals && totals.ctr !== null ? `${(totals.ctr * 100).toFixed(1)}%` : (loading ? '...' : '0%'),
      icon: Target,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      description: 'Click-through rate = clicks / views',
      rangeLabel: range === '7d' ? 'ბოლო 7 დღე' : range === '30d' ? 'ბოლო 30 დღე' : 'ბოლო 90 დღე',
      breakdown: {
        daily: clicksBreakdown.daily !== null && viewsBreakdown.daily ? `${((clicksBreakdown.daily / Math.max(viewsBreakdown.daily, 1)) * 100).toFixed(1)}%` : (loading ? '...' : '-'),
        weekly: clicksBreakdown.weekly !== null && viewsBreakdown.weekly ? `${((clicksBreakdown.weekly / Math.max(viewsBreakdown.weekly, 1)) * 100).toFixed(1)}%` : (loading ? '...' : '-'),
        monthly: clicksBreakdown.monthly !== null && viewsBreakdown.monthly ? `${((clicksBreakdown.monthly / Math.max(viewsBreakdown.monthly, 1)) * 100).toFixed(1)}%` : (loading ? '...' : '-')
      },
      trendPercent: totals && trend.ctr !== null && trend.ctr !== undefined ? (((totals.ctr || 0) - (trend.ctr || 0)) * 100) : null,
      trendLabel: 'წინა პერიოდთან'
    },
    {
      title: 'შენახვები',
      value: totals ? formatNumber(savesBreakdown.daily !== null || savesBreakdown.weekly !== null || savesBreakdown.monthly !== null ? (savesBreakdown.daily ?? 0) + (savesBreakdown.weekly ?? 0) + (savesBreakdown.monthly ?? 0) : 0) : (loading ? '...' : '0'),
      icon: Bookmark,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      description: 'Total favorites across day, week, and month',
      rangeLabel: range === '7d' ? 'ბოლო 7 დღე' : range === '30d' ? 'ბოლო 30 დღე' : 'ბოლო 90 დღე',
      breakdown: {
        daily: savesBreakdown.daily !== null ? formatNumber(savesBreakdown.daily) : (loading ? '...' : '-'),
        weekly: savesBreakdown.weekly !== null ? formatNumber(savesBreakdown.weekly) : (loading ? '...' : '-'),
        monthly: savesBreakdown.monthly !== null ? formatNumber(savesBreakdown.monthly) : (loading ? '...' : '-')
      },
      trendPercent: totals && trend.favorites !== undefined ? ((((savesBreakdown.daily ?? 0) + (savesBreakdown.weekly ?? 0) + (savesBreakdown.monthly ?? 0)) - (trend.favorites || 0)) / Math.max(trend.favorites || 0, 1)) * 100 : null,
      trendLabel: 'წინა პერიოდთან'
    }
  ];

  return (
    <div>
      {/* Header with time range selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">დაფის მიმოხილვა</h2>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="time-range">Time range</label>
          <select
            id="time-range"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
          >
            <option value="7d">ბოლო 7 დღე</option>
            <option value="30d">ბოლო 30 დღე</option>
            <option value="90d">ბოლო 90 დღე</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid with soft container */}
      <div className="rounded-2xl bg-gray-50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} loading={loading} />
        ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
