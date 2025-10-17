import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, LabelList } from 'recharts';
import { AnalyticsDemographicsBlock, AnalyticsTimeSeriesItem, AnalyticsActionCount } from '../services/api';
import { useI18n } from '../i18n';

interface AnalyticsChartsProps {
  demographics?: AnalyticsDemographicsBlock;
  timeseries?: AnalyticsTimeSeriesItem[];
  byAction?: AnalyticsActionCount[];
  loading?: boolean;
  activeTime?: { by_hour: { h: number; total: number }[]; by_dow: { dow: number; total: number }[] };
  retention?: { unique_users: number; returning_users: number; retention_rate: number | null };
  timeseriesByAction?: { d: string; action: string; total: number }[];
}

const COLORS = ['#3b82f6','#10b981','#f97316','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f59e0b'];

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ demographics, timeseries, byAction, loading, activeTime, retention, timeseriesByAction }) => {
  const [activeTab, setActiveTab] = useState('trends');
  const { t } = useI18n();

  const timeSeriesData = useMemo(() => {
    if (!timeseries) return [] as { date: string; total: number }[];
    return timeseries.map(t => ({ date: t.d, total: t.total }));
  }, [timeseries]);

  const multiSeriesData = useMemo(() => {
    if (!timeseriesByAction || timeseriesByAction.length === 0) return [] as any[];
    const byDate: Record<string, any> = {};
    timeseriesByAction.forEach(row => {
      const key = row.d;
      if (!byDate[key]) byDate[key] = { date: key } as any;
      byDate[key][row.action] = row.total;
    });
    return Object.values(byDate);
  }, [timeseriesByAction]);

  const deviceData = useMemo(() => {
    const items = demographics?.device || [];
    return items.map((d, i) => ({ name: d.k || t('analytics.unknown'), value: d.total, color: COLORS[i % COLORS.length] }));
  }, [demographics]);

  const ageData = useMemo(() => {
    const items = demographics?.age || [];
    const total = items.reduce((s, d) => s + d.total, 0) || 1;
    const order = ['<18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'Unknown'];
    const mapped = items.map(d => ({
      age: d.k || 'Unknown',
      value: d.total,
      pct: Math.round((d.total / total) * 1000) / 10, // one decimal percentage
    }));
    // Sort by predefined order; fall back to value desc
    mapped.sort((a, b) => {
      const ia = order.indexOf(a.age);
      const ib = order.indexOf(b.age);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return b.value - a.value;
    });
    return mapped;
  }, [demographics]);
  const [ageMetric, setAgeMetric] = useState<'percent' | 'count'>('percent');

  const locationData = useMemo(() => {
    const items = (demographics?.city || []).slice(0, 6);
    return items.map((d, i) => ({ name: d.k || t('analytics.unknown'), value: d.total, color: COLORS[i % COLORS.length] }));
  }, [demographics]);

  const totalActions = useMemo(() => {
    return (byAction || []).reduce((sum, a) => sum + a.total, 0);
  }, [byAction]);

  const tabs = [
    { id: 'devices', label: t('analytics.tabs.devices') },
    { id: 'trends', label: t('analytics.tabs.trends') },
    { id: 'demographics', label: t('analytics.tabs.demographics') },
    { id: 'active', label: t('analytics.tabs.active') },
    { id: 'retention', label: t('analytics.tabs.retention') },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button key={tab.id} className="px-4 py-2 text-sm font-medium rounded-md text-gray-400">{tab.label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-100 animate-pulse rounded-xl" />
          <div className="h-72 bg-gray-100 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  const isEmpty =
    (!demographics ||
      ((demographics.age?.length || 0) === 0 &&
       (demographics.device?.length || 0) === 0 &&
       (demographics.city?.length || 0) === 0)) &&
    ((timeseries?.length || 0) === 0) &&
    ((byAction?.length || 0) === 0) &&
    (!activeTime || ((activeTime.by_hour?.length || 0) === 0 && (activeTime.by_dow?.length || 0) === 0)) &&
    (!retention || retention.unique_users === 0);

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        {t('analytics.noDataForFilters')}
      </div>
    );
  }

  const renderChart = () => {
    switch (activeTab) {
      case 'devices':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('analytics.tabs.devices')}</h3>
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                  <Download size={16} />
                  <span>{t('analytics.generateReport')}</span>
                </button>
              </div>

              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <PieChart width={200} height={200}>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{t('analytics.total')}</div>
                      <div className="text-lg font-semibold text-gray-700">{totalActions}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {deviceData.length === 0 ? (
                  <div className="text-sm text-gray-500">{t('analytics.noDeviceData')}</div>
                ) : deviceData.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }}></div>
                      <span className="text-sm text-gray-600">{stat.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'trends':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t('analytics.performanceTrends')}</h3>
              <div />
            </div>

            {multiSeriesData.length === 0 ? (
              timeSeriesData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-500">{t('analytics.noTimeSeriesData')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              )
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={multiSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="view" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="clicked" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="redirect" stroke="#f97316" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="map_open" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="share" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="favorite" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{byAction?.find(a => a.action === 'view')?.total ?? 0}</div>
                <div className="text-sm text-gray-600">{t('analytics.metric.views')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{byAction?.find(a => a.action === 'clicked')?.total ?? 0}</div>
                <div className="text-sm text-gray-600">{t('analytics.metric.clicks')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{byAction?.find(a => a.action === 'redirect')?.total ?? 0}</div>
                <div className="text-sm text-gray-600">{t('analytics.metric.redirects')}</div>
              </div>
            </div>
          </div>
        );

      case 'demographics':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('analytics.ageDistribution')}</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <button onClick={() => setAgeMetric('percent')} className={`px-2 py-1 text-xs rounded ${ageMetric === 'percent' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}>%</button>
                    <button onClick={() => setAgeMetric('count')} className={`px-2 py-1 text-xs rounded ${ageMetric === 'count' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}>#</button>
                  </div>
                  <button className="hidden md:flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                    <Download size={16} />
                    <span>{t('analytics.export')}</span>
                  </button>
                </div>
              </div>

              {ageData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-500">{t('analytics.noAgeData')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ageData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => ageMetric === 'percent' ? `${v}%` : `${v}`} domain={[0, 'auto']} />
                    <YAxis dataKey="age" type="category" width={70} />
                    <Tooltip formatter={(value: any) => {
                      return ageMetric === 'percent' ? [`${value}%`, t('analytics.percentage')] : [value, t('analytics.users')];
                    }} />
                    <Bar dataKey={ageMetric === 'percent' ? 'pct' : 'value'} fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      <LabelList dataKey={ageMetric === 'percent' ? 'pct' : 'value'} position="right" formatter={(v: any) => ageMetric === 'percent' ? `${v}%` : v} className="text-xs fill-gray-700" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('analytics.geoDistribution')}</h3>
              </div>

              {locationData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-500">{t('analytics.noLocationData')}</div>
              ) : (
                <div className="flex items-center justify-center mb-6">
                  <PieChart width={200} height={200}>
                    <Pie
                      data={locationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {locationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
              )}

              <div className="space-y-2">
                {locationData.length === 0 ? (
                  <div className="text-sm text-gray-500">{t('analytics.noLocationBreakdown')}</div>
                ) : locationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'active':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('analytics.byHour')}</h3>
              </div>
              {(!activeTime || activeTime.by_hour.length === 0) ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-500">{t('analytics.noHourlyData')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activeTime.by_hour.map(h => ({ hour: h.h, total: h.total }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('analytics.byDayOfWeek')}</h3>
              </div>
              {(!activeTime || activeTime.by_dow.length === 0) ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-500">{t('analytics.noDowData')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activeTime.by_dow.map(d => ({ dow: d.dow, total: d.total }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dow" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8b5cf6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        );

      case 'retention':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t('analytics.retention')}</h3>
            </div>
            {!retention ? (
              <div className="h-32 flex items-center justify-center text-sm text-gray-500">{t('analytics.noRetentionData')}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{retention.unique_users}</div>
                  <div className="text-sm text-gray-600">{t('analytics.uniqueUsers')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{retention.returning_users}</div>
                  <div className="text-sm text-gray-600">{t('analytics.returningUsers')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{retention.retention_rate !== null ? `${(retention.retention_rate*100).toFixed(1)}%` : '—'}</div>
                  <div className="text-sm text-gray-600">{t('analytics.retentionRate')}</div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderChart()}
    </div>
  );
};

export default AnalyticsCharts;
