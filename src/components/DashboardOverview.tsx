import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Target, Bookmark, Plus, Calendar as CalendarIcon, LucideIcon } from 'lucide-react';
import MetricCard from './MetricCard';
import { apiService, Company } from '../services/api';
import { useCompany } from '../contexts/CompanyContext';

const DashboardOverview: React.FC = () => {
  const { company, refreshCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState<{ views: number; clicks: number; shares: number; ctr: number | null } | null>(null);
  const [viewsBreakdown, setViewsBreakdown] = useState<{ daily: number | null; weekly: number | null; monthly: number | null }>({ daily: null, weekly: null, monthly: null });
  const [clicksBreakdown, setClicksBreakdown] = useState<{ daily: number | null; weekly: number | null; monthly: number | null }>({ daily: null, weekly: null, monthly: null });
  const [savesBreakdown, setSavesBreakdown] = useState<{ daily: number | null; weekly: number | null; monthly: number | null }>({ daily: null, weekly: null, monthly: null });

  useEffect(() => {
    const load = async () => {
      if (!company) {
        await refreshCompany();
      }
      const c = company || null;
      if (!c?.id) return;
      try {
        setLoading(true);
        const res = await apiService.companyAnalyticsTotals({ company_id: c.id });
        const t = res.totals;
        setTotals({
          views: t.total_views || 0,
          clicks: t.total_clicks || 0,
          shares: t.total_shares || 0,
          ctr: t.ctr ?? null,
        });
        // Fetch breakdowns in parallel
        const nowIso = new Date().toISOString();
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
  }, [company?.id]);

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
  }> = [
    {
      title: 'ჯამური ნახვები',
      value: totals ? formatNumber(totals.views) : (loading ? '...' : '0'),
      badge: 'Total',
      badgeColor: 'green',
      icon: Calendar,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      breakdown: {
        daily: viewsBreakdown.daily !== null ? formatNumber(viewsBreakdown.daily) : (loading ? '...' : '-'),
        weekly: viewsBreakdown.weekly !== null ? formatNumber(viewsBreakdown.weekly) : (loading ? '...' : '-'),
        monthly: viewsBreakdown.monthly !== null ? formatNumber(viewsBreakdown.monthly) : (loading ? '...' : '-')
      }
    },
    {
      title: 'ჯამური კლიკები',
      value: totals ? formatNumber(totals.clicks) : (loading ? '...' : '0'),
      icon: Target,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      breakdown: {
        daily: clicksBreakdown.daily !== null ? formatNumber(clicksBreakdown.daily) : (loading ? '...' : '-'),
        weekly: clicksBreakdown.weekly !== null ? formatNumber(clicksBreakdown.weekly) : (loading ? '...' : '-'),
        monthly: clicksBreakdown.monthly !== null ? formatNumber(clicksBreakdown.monthly) : (loading ? '...' : '-')
      }
    },
    {
      title: 'CTR',
      value: totals && totals.ctr !== null ? `${(totals.ctr * 100).toFixed(1)}%` : (loading ? '...' : '0%'),
      icon: Target,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      breakdown: {
        daily: clicksBreakdown.daily !== null && viewsBreakdown.daily ? `${((clicksBreakdown.daily / Math.max(viewsBreakdown.daily, 1)) * 100).toFixed(1)}%` : (loading ? '...' : '-'),
        weekly: clicksBreakdown.weekly !== null && viewsBreakdown.weekly ? `${((clicksBreakdown.weekly / Math.max(viewsBreakdown.weekly, 1)) * 100).toFixed(1)}%` : (loading ? '...' : '-'),
        monthly: clicksBreakdown.monthly !== null && viewsBreakdown.monthly ? `${((clicksBreakdown.monthly / Math.max(viewsBreakdown.monthly, 1)) * 100).toFixed(1)}%` : (loading ? '...' : '-')
      }
    },
    {
      title: 'ჯამური შენახვები',
      value: totals ? formatNumber(savesBreakdown.daily !== null || savesBreakdown.weekly !== null || savesBreakdown.monthly !== null ? (savesBreakdown.daily ?? 0) + (savesBreakdown.weekly ?? 0) + (savesBreakdown.monthly ?? 0) : 0) : (loading ? '...' : '0'),
      icon: Bookmark,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      breakdown: {
        daily: savesBreakdown.daily !== null ? formatNumber(savesBreakdown.daily) : (loading ? '...' : '-'),
        weekly: savesBreakdown.weekly !== null ? formatNumber(savesBreakdown.weekly) : (loading ? '...' : '-'),
        monthly: savesBreakdown.monthly !== null ? formatNumber(savesBreakdown.monthly) : (loading ? '...' : '-')
      }
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">დაფის მიმოხილვა</h2>
        {/* <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2">
            <CalendarIcon size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">01 მაისი – 31 მაისი</span>
          </div>
          <button className="bg-accent-purple hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
            <Plus size={16} />
            <span>დამატება</span>
          </button>
        </div> */}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
