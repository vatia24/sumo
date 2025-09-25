import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Download, Filter, TrendingUp, TrendingDown, Eye, MousePointer, Smartphone, Monitor, MapPin, Share2, Heart, ExternalLink, ThumbsDown } from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';
import { apiService, AnalyticsSummaryResponse, CompanyAnalyticsTotals, Discount } from '../services/api';
import { useCompany } from '../contexts/CompanyContext';

const AnalyticsPage: React.FC = () => {
  const { company, refreshCompany } = useCompany();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [companyTotals, setCompanyTotals] = useState<CompanyAnalyticsTotals | null>(null);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [productNames, setProductNames] = useState<Record<number, string>>({});
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | undefined>(undefined);
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 1247,
    pagesViewed: 89,
    conversions: 23
  });

  // Simulate real-time data updates (UI only)
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: Math.max(0, prev.activeUsers + Math.floor(Math.random() * 10) - 5),
        pagesViewed: Math.max(0, prev.pagesViewed + Math.floor(Math.random() * 5) - 2),
        conversions: Math.max(0, prev.conversions + Math.floor(Math.random() * 3) - 1)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Period -> from/to mapping
  useEffect(() => {
    if (selectedPeriod === 'all') {
      setFromDate(undefined);
      setToDate(undefined);
      return;
    }
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = new Date(end);
    if (selectedPeriod === '7d') start.setDate(end.getDate() - 6);
    else if (selectedPeriod === '30d') start.setDate(end.getDate() - 29);
    else if (selectedPeriod === '90d') start.setDate(end.getDate() - 89);
    else if (selectedPeriod === '1y') start = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setFromDate(fmt(start));
    setToDate(fmt(end));
  }, [selectedPeriod]);

  // Ensure company is loaded
  useEffect(() => {
    if (!company) {
      refreshCompany();
    }
  }, [company, refreshCompany]);

  // Load discounts for company
  useEffect(() => {
    const fetchDiscounts = async () => {
      if (!company?.id) return;
      try {
        const { discounts } = await apiService.listDiscounts({ company_id: company.id, limit: 100 });
        setDiscounts(discounts);
      } catch (e: any) {
        console.error(e);
      }
    };
    fetchDiscounts();
  }, [company?.id]);

  // Enrich discount labels using product names when discount title is empty
  useEffect(() => {
    const loadProducts = async () => {
      if (!company?.id) return;
      try {
        const resp = await apiService.listProducts({ company_id: company.id, limit: 500 });
        const map: Record<number, string> = {};
        (resp.products || []).forEach((p: any) => { map[p.id] = p.name; });
        setProductNames(map);
      } catch (e) {
        // ignore
      }
    };
    loadProducts();
  }, [company?.id]);

  // Load company totals and discount summary
  useEffect(() => {
    const load = async () => {
      if (!company?.id) return;
      try {
        setLoading(true);
        setError(null);
        const toParam = toDate ? `${toDate} 23:59:59` : undefined;
        const totalsParams: any = { company_id: company.id };
        if (fromDate) totalsParams.from = fromDate;
        if (toParam) totalsParams.to = toParam;
        if (deviceType) totalsParams.device_type = deviceType;
        if (city) totalsParams.city = city;
        if (region) totalsParams.region = region;

        const summaryParams: any = selectedDiscountId ? { discount_id: selectedDiscountId, granularity: 'day' } : { company_id: company.id, granularity: 'day' };
        if (summaryParams) {
          if (fromDate) summaryParams.from = fromDate;
          if (toParam) summaryParams.to = toParam;
          if (deviceType) summaryParams.device_type = deviceType;
          if (city) summaryParams.city = city;
          if (region) summaryParams.region = region;
        }

        const [totalsResp, summaryResp] = await Promise.all([
          apiService.companyAnalyticsTotals(totalsParams),
          apiService.analyticsSummary(summaryParams)
        ]);
        setCompanyTotals(totalsResp.totals);
        setSummary(summaryResp);
      } catch (e: any) {
        setError(e.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [company?.id, fromDate, toDate, selectedDiscountId, deviceType, city, region]);

  const handleExport = () => {
    // Build CSV from live data
    const lines: string[] = [];
    lines.push('Metric,Value');
    if (companyTotals) {
      lines.push(`Views,${companyTotals.total_views}`);
      lines.push(`Clicks,${companyTotals.total_clicks}`);
      lines.push(`Redirects,${companyTotals.total_redirects}`);
      lines.push(`CTR,${companyTotals.ctr !== null ? (companyTotals.ctr * 100).toFixed(2) + '%"' : '—'}`);
    }
    if (summary) {
      lines.push('');
      lines.push('Action,Total');
      summary.summary.by_action.forEach(a => lines.push(`${a.action},${a.total}`));
      lines.push('');
      lines.push('Timeseries Date,Total');
      summary.timeseries.forEach(t => lines.push(`${t.d},${t.total}`));
    }
    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics-${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const overviewStats = useMemo(() => {
    const totals = companyTotals;
    return [
      {
        title: 'Views',
        value: totals ? totals.total_views.toLocaleString() : '—',
        change: '',
        trend: 'up',
        icon: Eye,
        color: 'bg-blue-500'
      },
      {
        title: 'Clicks',
        value: totals ? totals.total_clicks.toLocaleString() : '—',
        change: '',
        trend: 'up',
        icon: MousePointer,
        color: 'bg-purple-500'
      },
      {
        title: 'Redirects',
        value: totals ? totals.total_redirects.toLocaleString() : '—',
        change: '',
        trend: 'up',
        icon: TrendingUp,
        color: 'bg-orange-500'
      },
      {
        title: 'CTR',
        value: totals && totals.ctr !== null ? `${(totals.ctr * 100).toFixed(2)}%` : '—',
        change: '',
        trend: 'up',
        icon: TrendingUp,
        color: 'bg-green-500'
      }
    ];
  }, [companyTotals]);

  const deviceBreakdown = useMemo(() => {
    const items = summary?.demographics.device || [];
    const total = items.reduce((s, i) => s + i.total, 0) || 1;
    return items.map(i => ({ device: i.k || 'Unknown', percentage: Math.round((i.total / total) * 100), users: i.total.toLocaleString(), change: '' }));
  }, [summary]);

  const [top, setTop] = useState<{ discount_id: number; total: number }[] | null>(null);
  const [topMetric, setTopMetric] = useState<'view' | 'clicked' | 'redirect' | 'map_open' | 'share' | 'favorite' | 'not_interested'>('view');
  useEffect(() => {
    const loadTop = async () => {
      if (!company?.id) return;
      try {
        const toParam = toDate ? `${toDate} 23:59:59` : undefined;
        const params: any = { action: topMetric, company_id: company.id, limit: 5 };
        if (fromDate) params.from = fromDate;
        if (toParam) params.to = toParam;
        if (deviceType) params.device_type = deviceType;
        if (city) params.city = city;
        if (region) params.region = region;
        const resp = await apiService.topDiscounts(params);
        setTop(resp.top);
      } catch (e) {
        // ignore
      }
    };
    loadTop();
  }, [company?.id, fromDate, toDate, topMetric, deviceType, city, region]);

  const discountNameById = useMemo(() => {
    const map: Record<number, string> = {};
    discounts.forEach(d => {
      const title = (d as any).title;
      const label = title && title.trim().length > 0 ? title : (d.product_id ? (productNames[d.product_id] || `Discount #${d.id}`) : `Discount #${d.id}`);
      map[d.id] = label;
    });
    return map;
  }, [discounts, productNames]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ანალიტიკა</h1>
          <p className="text-gray-600 mt-1">Track your performance and user behavior</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Calendar size={16} className="text-gray-500" />
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-sm border-none focus:ring-0"
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Filter size={16} className="text-gray-500" />
            <select 
              value={selectedDiscountId || ''}
              onChange={(e) => setSelectedDiscountId(e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm border-none focus:ring-0"
            >
              <option value="">All discounts</option>
              {discounts.map(d => {
                const title = (d as any).title;
                const label = title && title.trim().length > 0 ? title : (d.product_id ? (productNames[d.product_id] || `Discount #${d.id}`) : `Discount #${d.id}`);
                return (
                  <option key={d.id} value={d.id}>{label}</option>
                );
              })}
            </select>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500">Device</span>
            <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="text-sm border-none focus:ring-0">
              <option value="">All</option>
              <option value="Mobile">Mobile</option>
              <option value="Desktop">Desktop</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="text-sm border-none focus:ring-0 placeholder-gray-400" />
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" className="text-sm border-none focus:ring-0 placeholder-gray-400" />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon size={20} className="text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <div className={`flex items-center text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span className="ml-1">{stat.change}</span>
              </div>
              <span className="text-sm text-gray-500 ml-2">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Performance Charts</h2>
          <div />
        </div>
        {error && (
          <div className="text-sm text-red-600 mb-4">{error}</div>
        )}
        <AnalyticsCharts 
          demographics={summary?.demographics}
          timeseries={summary?.timeseries}
          byAction={summary?.summary.by_action}
          activeTime={summary?.active_time}
          retention={summary?.retention}
          timeseriesByAction={summary?.timeseries_by_action}
          loading={loading}
        />
      </div>

      {/* Interactions Breakdown (selected discount) */}
      {selectedDiscountId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount Interactions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { key: 'view', label: 'Impressions', icon: Eye, color: 'text-blue-600' },
              { key: 'clicked', label: 'Clicks', icon: MousePointer, color: 'text-green-600' },
              { key: 'redirect', label: 'Outbound', icon: ExternalLink, color: 'text-orange-600' },
              { key: 'map_open', label: 'Address views', icon: MapPin, color: 'text-purple-600' },
              { key: 'share', label: 'Shares', icon: Share2, color: 'text-cyan-600' },
              { key: 'favorite', label: 'Favorites', icon: Heart, color: 'text-rose-600' },
            ].map((m, idx) => {
              const total = summary?.summary.by_action.find(a => a.action === m.key)?.total ?? 0;
              return (
                <div key={idx} className="rounded-lg border border-gray-100 p-4">
                  <div className={`flex items-center space-x-2 text-sm text-gray-500`}>
                    <m.icon size={16} className={m.color} />
                    <span>{m.label}</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">{total.toLocaleString()}</div>
                </div>
              );
            })}
            {/* Not interested if present */}
            {(() => {
              const ni = summary?.summary.by_action.find(a => a.action === 'not_interested')?.total;
              if (typeof ni === 'number') {
                return (
                  <div className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <ThumbsDown size={16} className="text-gray-600" />
                      <span>Not interested</span>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 mt-1">{ni.toLocaleString()}</div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
          {/* CTR and Conversion proxies */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-sm text-gray-500">CTR</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">{(summary && summary.summary.ctr !== null) ? `${(summary.summary.ctr*100).toFixed(2)}%` : '—'}</div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-sm text-gray-500">Store visits (proxy)</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">{(summary?.summary.by_action.find(a => a.action === 'map_open')?.total ?? 0).toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-sm text-gray-500">Outbound clicks</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">{(summary?.summary.by_action.find(a => a.action === 'redirect')?.total ?? 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            {deviceBreakdown.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {device.device === 'Mobile' && <Smartphone size={16} className="text-gray-500" />}
                    {device.device === 'Desktop' && <Monitor size={16} className="text-gray-500" />}
                    {device.device === 'Tablet' && <Smartphone size={16} className="text-gray-500" />}
                    <span className="text-sm font-medium text-gray-900">{device.device}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{device.users}</div>
                    <div className="text-xs text-gray-500">{device.percentage}%</div>
                  </div>
                  <div className={`text-xs ${device.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {device.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Discounts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Discounts</h3>
            <select value={topMetric} onChange={(e) => setTopMetric(e.target.value as any)} className="text-sm border border-gray-200 rounded-md px-2 py-1">
              <option value="view">By Views</option>
              <option value="clicked">By Clicks</option>
              <option value="redirect">By Outbound</option>
              <option value="map_open">By Address Views</option>
              <option value="share">By Shares</option>
              <option value="favorite">By Favorites</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>
          <div className="space-y-4">
            {top?.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{discountNameById[item.discount_id] || `Discount #${item.discount_id}`}</p>
                </div>
                <div className="text-sm text-gray-600">{item.total.toLocaleString()}</div>
              </div>
            ))}
            {!top && (
              <div className="text-sm text-gray-500">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Benchmarking vs company average (Clicks) */}
      {selectedDiscountId && (
        <BenchmarkBanner 
          companyId={company?.id}
          discountClicks={summary?.summary.by_action.find(a => a.action === 'clicked')?.total ?? 0}
          from={fromDate}
          to={toDate}
          device_type={deviceType || undefined}
          city={city || undefined}
          region={region || undefined}
        />
      )}

      {/* Real-time Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{realTimeData.activeUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Active users now</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{realTimeData.pagesViewed}</div>
            <div className="text-sm text-gray-600">Pages viewed/min</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{realTimeData.conversions}</div>
            <div className="text-sm text-gray-600">Conversions today</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

// Lightweight internal component for benchmarking
const BenchmarkBanner: React.FC<{ companyId?: number; discountClicks: number; from?: string; to?: string; device_type?: string; city?: string; region?: string; }> = ({ companyId, discountClicks, from, to, device_type, city, region }) => {
  const [avg, setAvg] = useState<number | null>(null);
  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      try {
        const params: any = { action: 'clicked', company_id: companyId, limit: 50 };
        if (from) params.from = from;
        if (to) params.to = `${to} 23:59:59`;
        if (device_type) params.device_type = device_type;
        if (city) params.city = city;
        if (region) params.region = region;
        const resp = await apiService.topDiscounts(params);
        if (resp.top.length === 0) { setAvg(0); return; }
        const sum = resp.top.reduce((s, t) => s + t.total, 0);
        setAvg(Math.round(sum / resp.top.length));
      } catch {}
    };
    load();
  }, [companyId, from, to, device_type, city, region]);
  if (avg === null) return null;
  const diff = avg > 0 ? ((discountClicks - avg) / avg) * 100 : (discountClicks > 0 ? 100 : 0);
  const up = diff >= 0;
  return (
    <div className={`rounded-xl border ${up ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'} p-4`}> 
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-800">
          {up ? 'Great job!' : 'Opportunity to improve:'} Your discount received <span className="font-semibold">{Math.abs(diff).toFixed(0)}%</span> {up ? 'more' : 'less'} clicks than the company average.
        </div>
      </div>
    </div>
  );
};
