import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const AnalyticsCharts: React.FC = () => {
  const [activeTab, setActiveTab] = useState('devices');
  const [timeRange, setTimeRange] = useState('7d');

  // Devices data
  const devicesData = [
    { name: 'iOS', value: 45, color: '#ef4444' },
    { name: 'Android', value: 38, color: '#10b981' },
    { name: 'Desktop', value: 17, color: '#f97316' }
  ];

  // Age data
  const ageData = [
    { age: '-18', value: 12 },
    { age: '18-24', value: 25 },
    { age: '25-34', value: 45 },
    { age: '35-44', value: 32 },
    { age: '45-64', value: 18 },
    { age: '65+', value: 8 }
  ];

  // Time series data for trends
  const timeSeriesData = [
    { date: 'Mon', views: 85, clicks: 12, conversions: 3 },
    { date: 'Tue', views: 92, clicks: 15, conversions: 4 },
    { date: 'Wed', views: 78, clicks: 11, conversions: 2 },
    { date: 'Thu', views: 105, clicks: 18, conversions: 5 },
    { date: 'Fri', views: 88, clicks: 14, conversions: 3 },
    { date: 'Sat', views: 95, clicks: 16, conversions: 4 },
    { date: 'Sun', views: 82, clicks: 13, conversions: 3 }
  ];

  // Location data
  const locationData = [
    { name: 'Tbilisi', value: 35, color: '#3b82f6' },
    { name: 'Batumi', value: 28, color: '#10b981' },
    { name: 'Kutaisi', value: 22, color: '#6b7280' },
    { name: 'Rustavi', value: 15, color: '#f97316' },
    { name: 'Other', value: 8, color: '#8b5cf6' }
  ];

  const deviceStats = [
    { name: 'iOS', value: '45', change: '-3.91%', trend: 'down' },
    { name: 'Android', value: '38', change: '+3.91%', trend: 'up' },
    { name: 'Desktop', value: '17', change: '+1.05%', trend: 'up' }
  ];

  const tabs = [
    { id: 'devices', label: 'Devices' },
    { id: 'trends', label: 'Trends' },
    { id: 'demographics', label: 'Demographics' }
  ];

  const renderChart = () => {
    switch (activeTab) {
      case 'devices':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Devices Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Devices</h3>
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                  <Download size={16} />
                  <span>Generate Report</span>
                </button>
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <PieChart width={200} height={200}>
                    <Pie
                      data={devicesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {devicesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">Total</div>
                      <div className="text-lg font-semibold text-gray-700">100</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {deviceStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: devicesData[index]?.color }}></div>
                      <span className="text-sm text-gray-600">{stat.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{stat.value}</span>
                      <div className={`flex items-center text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{stat.change}</span>
                      </div>
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
              <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
              <div className="flex items-center space-x-2">
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-1"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="views" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="clicks" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="conversions" stackId="3" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">15.2K</div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">1.3K</div>
                <div className="text-sm text-gray-600">Total Clicks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">185</div>
                <div className="text-sm text-gray-600">Conversions</div>
              </div>
            </div>
          </div>
        );

      case 'demographics':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Age Distribution</h3>
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                  <Download size={16} />
                  <span>Generate Report</span>
                </button>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="age" type="category" width={60} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Location Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
              </div>
              
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

              <div className="space-y-2">
                {locationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">Region {index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
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

      {/* Chart Content */}
      {renderChart()}
    </div>
  );
};

export default AnalyticsCharts;
