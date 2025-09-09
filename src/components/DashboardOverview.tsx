import React from 'react';
import { Calendar, Users, Target, Share2, ExternalLink, Plus, Calendar as CalendarIcon, LucideIcon } from 'lucide-react';
import MetricCard from './MetricCard';

const DashboardOverview: React.FC = () => {
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
      value: '185.5k',
      badge: 'Total',
      badgeColor: 'green',
      icon: Calendar,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      breakdown: {
        daily: '1247',
        weekly: '89.5k',
        monthly: '89.5k'
      }
    },
    {
      title: 'Total Saves',
      value: '75.6K',
      icon: Users,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      breakdown: {
        daily: '61',
        weekly: '75.5k',
        monthly: '75.5k'
      }
    },
    {
      title: 'კლიკები (CTR)',
      value: '75.6K',
      icon: Target,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      breakdown: {
        daily: '12.3%',
        weekly: '22.3%',
        monthly: '52.3%'
      }
    },
    {
      title: 'ჯამური გაზიარებები',
      value: '75.6K',
      icon: Share2,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      breakdown: {
        daily: '1247',
        weekly: '75.5k',
        monthly: '75.5k'
      }
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">დაფის მიმოხილვა</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2">
            <CalendarIcon size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">01 მაისი – 31 მაისი</span>
          </div>
          <button className="bg-accent-purple hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
            <Plus size={16} />
            <span>დამატება</span>
          </button>
        </div>
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
