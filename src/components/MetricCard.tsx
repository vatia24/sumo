import React from 'react';
import { ExternalLink, LucideIcon } from 'lucide-react';

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
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  badge,
  badgeColor = 'green',
  icon: Icon,
  iconBg,
  iconColor,
  breakdown
}) => {
  const badgeColorClasses = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="metric-card relative">
      {/* External link icon */}
      <button className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded">
        <ExternalLink size={16} className="text-gray-400" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
        {badge && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColorClasses[badgeColor as keyof typeof badgeColorClasses]}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Main value */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Daily</span>
          <span className="font-medium text-gray-900">{breakdown.daily}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Weekly</span>
          <span className="font-medium text-gray-900">{breakdown.weekly}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Monthly</span>
          <span className="font-medium text-gray-900">{breakdown.monthly}</span>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
