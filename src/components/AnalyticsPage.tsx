import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, TrendingUp, TrendingDown, Users, Eye, MousePointer, Smartphone, Monitor } from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';

const AnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 1247,
    pagesViewed: 89,
    conversions: 23
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        pagesViewed: prev.pagesViewed + Math.floor(Math.random() * 5) - 2,
        conversions: prev.conversions + Math.floor(Math.random() * 3) - 1
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    // Create a simple CSV export
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value,Change\n"
      + "Total Views,2.4M,+12.5%\n"
      + "Unique Visitors,847K,+8.2%\n"
      + "Click Rate,3.2%,-1.1%\n"
      + "Conversion Rate,1.8%,+2.3%\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics-${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock analytics data
  const overviewStats = [
    {
      title: 'ჯამური ნახვები',
      value: '2.4M',
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
      color: 'bg-blue-500'
    },
    {
      title: 'Unique Visitors',
      value: '847K',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Click Rate',
      value: '3.2%',
      change: '-1.1%',
      trend: 'down',
      icon: MousePointer,
      color: 'bg-purple-500'
    },
    {
      title: 'Conversion Rate',
      value: '1.8%',
      change: '+2.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ];

  const deviceBreakdown = [
    { device: 'Mobile', percentage: 65, users: '1.56M', change: '+5.2%' },
    { device: 'Desktop', percentage: 28, users: '672K', change: '+2.1%' },
    { device: 'Tablet', percentage: 7, users: '168K', change: '-1.3%' }
  ];

  const topPages = [
    { page: '/offers/electronics', views: '245K', bounce: '32%', time: '2m 34s' },
    { page: '/offers/fashion', views: '198K', bounce: '28%', time: '3m 12s' },
    { page: '/offers/home', views: '156K', bounce: '35%', time: '2m 8s' },
    { page: '/offers/sports', views: '134K', bounce: '41%', time: '1m 45s' }
  ];

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
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
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
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-gray-200 rounded px-2 py-1"
            >
              <option value="all">All Metrics</option>
              <option value="views">Views</option>
              <option value="clicks">Clicks</option>
              <option value="conversions">Conversions</option>
            </select>
          </div>
        </div>
        <AnalyticsCharts />
      </div>

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

        {/* Top Pages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Pages</h3>
          <div className="space-y-4">
            {topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{page.page}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">{page.views} views</span>
                    <span className="text-xs text-gray-500">{page.bounce} bounce</span>
                    <span className="text-xs text-gray-500">{page.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
