import React from 'react';
import { ExternalLink, LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
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
  loading?: boolean;
  rangeLabel?: string;
  trendPercent?: number | null;
  trendLabel?: string;
  onOpen?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  badge,
  badgeColor = 'green',
  icon: Icon,
  iconBg,
  iconColor,
  breakdown,
  description,
  loading = false,
  rangeLabel,
  trendPercent = null,
  trendLabel,
  onOpen
}) => {
  const badgeColorClasses = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onOpen) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      className={`metric-card relative overflow-visible animate-scale-in ${onOpen ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none' : ''}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : -1}
      aria-label={onOpen ? `${title} details` : undefined}
    >
      {/* Floating icon chip */}
      <div className={`absolute -top-5 left-6 h-12 w-12 rounded-xl shadow-lg ring-4 ring-white flex items-center justify-center ${iconBg} transition-base`}> 
        <Icon size={22} className={iconColor} />
      </div>
      {/* External link icon */}
      <button className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded transition-base" aria-label="Open details" onClick={(e) => { e.stopPropagation(); onOpen?.(); }}>
        <ExternalLink size={16} className="text-gray-400" />
      </button>

      {/* Header (space for badge on the right) */}
      <div className="flex items-center justify-between mb-3">
        <div className="pl-16 flex items-center gap-2">
          {rangeLabel && (
            <span className="text-[11px] text-gray-500">
              {rangeLabel}
            </span>
          )}
        </div>
        {badge && (
          <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${badgeColorClasses[badgeColor as keyof typeof badgeColorClasses]}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Main value with tooltip */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
          {description && (
            <span className="text-gray-600" title={description}>ⓘ</span>
          )}
        </div>
        {loading ? (
          <div className="h-8 w-28 mx-auto skeleton" />
        ) : (
          <p className="text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight text-center tabular-nums" title={value}>{value}</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 -mx-6 mb-3" />

      {/* Trend row */}
      {typeof trendPercent === 'number' && !Number.isNaN(trendPercent) && (
        <div className="flex items-center gap-2 text-xs mb-2 justify-center">
          {trendPercent >= 0 ? (
            <ArrowUpRight size={16} className="text-green-600" />
          ) : (
            <ArrowDownRight size={16} className="text-red-600" />
          )}
          <span className={`${trendPercent >= 0 ? 'text-green-700' : 'text-red-700'} font-medium tabular-nums`}>
            {trendPercent >= 0 ? '+' : ''}{Math.abs(trendPercent).toFixed(1)}%
          </span>
          {trendLabel && <span className="text-gray-500">{trendLabel}</span>}
        </div>
      )}

      {/* Breakdown */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">დღე</span>
          {loading ? <span className="h-4 w-10 skeleton" /> : <span className="font-medium text-gray-900 tabular-nums text-right">{breakdown.daily}</span>}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">კვირა</span>
          {loading ? <span className="h-4 w-12 skeleton" /> : <span className="font-medium text-gray-900 tabular-nums text-right">{breakdown.weekly}</span>}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">თვე</span>
          {loading ? <span className="h-4 w-16 skeleton" /> : <span className="font-medium text-gray-900 tabular-nums text-right">{breakdown.monthly}</span>}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
