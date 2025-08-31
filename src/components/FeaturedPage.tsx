import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Target, 
  BarChart3, 
  Settings,
  Filter,
  Search,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Image as ImageIcon,
  Video,
  FileText,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';

interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  type: 'product' | 'offer' | 'content' | 'event';
  status: 'active' | 'scheduled' | 'inactive' | 'expired';
  priority: 'high' | 'medium' | 'low';
  startDate: string;
  endDate: string;
  imageUrl?: string;
  targetAudience: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: string;
  tags: string[];
}

const FeaturedPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FeaturedItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data
  useEffect(() => {
    const mockFeaturedItems: FeaturedItem[] = [
      {
        id: '1',
        title: 'Summer Sale Collection',
        description: 'Get up to 70% off on summer fashion items. Limited time offer!',
        type: 'offer',
        status: 'active',
        priority: 'high',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-02-01T00:00:00Z',
        imageUrl: '/images/summer-sale.jpg',
        targetAudience: 'All Users',
        views: 15420,
        clicks: 8234,
        conversions: 2341,
        revenue: 45678,
        createdAt: '2024-01-01T00:00:00Z',
        tags: ['summer', 'sale', 'fashion']
      },
      {
        id: '2',
        title: 'New Product Launch',
        description: 'Introducing our latest premium product with amazing features.',
        type: 'product',
        status: 'scheduled',
        priority: 'high',
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-03-15T00:00:00Z',
        imageUrl: '/images/new-product.jpg',
        targetAudience: 'Premium Users',
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        createdAt: '2024-01-10T00:00:00Z',
        tags: ['new', 'premium', 'launch']
      },
      {
        id: '3',
        title: 'Holiday Special Event',
        description: 'Join us for exclusive holiday deals and special promotions.',
        type: 'event',
        status: 'active',
        priority: 'medium',
        startDate: '2024-01-10T00:00:00Z',
        endDate: '2024-01-25T00:00:00Z',
        imageUrl: '/images/holiday-event.jpg',
        targetAudience: 'All Users',
        views: 8920,
        clicks: 4456,
        conversions: 1234,
        revenue: 23456,
        createdAt: '2024-01-05T00:00:00Z',
        tags: ['holiday', 'event', 'special']
      },
      {
        id: '4',
        title: 'Featured Blog Post',
        description: 'Read our latest insights on industry trends and best practices.',
        type: 'content',
        status: 'active',
        priority: 'low',
        startDate: '2024-01-08T00:00:00Z',
        endDate: '2024-02-08T00:00:00Z',
        imageUrl: '/images/blog-post.jpg',
        targetAudience: 'Content Readers',
        views: 5678,
        clicks: 2345,
        conversions: 567,
        revenue: 8901,
        createdAt: '2024-01-08T00:00:00Z',
        tags: ['blog', 'content', 'insights']
      }
    ];
    setFeaturedItems(mockFeaturedItems);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'manage', label: 'Manage', icon: Settings },
    { id: 'scheduled', label: 'Scheduled', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const itemTypes = [
    { id: 'product', label: 'Product', icon: ShoppingCart, color: 'bg-blue-500' },
    { id: 'offer', label: 'Offer', icon: DollarSign, color: 'bg-green-500' },
    { id: 'content', label: 'Content', icon: FileText, color: 'bg-purple-500' },
    { id: 'event', label: 'Event', icon: Calendar, color: 'bg-orange-500' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'scheduled': return <Clock size={16} />;
      case 'inactive': return <XCircle size={16} />;
      case 'expired': return <XCircle size={16} />;
      default: return <XCircle size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getItemTypeIcon = (typeId: string) => {
    const itemType = itemTypes.find(type => type.id === typeId);
    return itemType?.icon;
  };

  const getItemTypeColor = (typeId: string) => {
    const itemType = itemTypes.find(type => type.id === typeId);
    return itemType?.color || 'bg-gray-500';
  };

  const filteredItems = featuredItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Featured Content Overview</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Add Featured Item</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Items</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">45.2K</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Eye size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$89.2K</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">15.2%</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Items Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Featured</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.filter(item => item.status === 'active').map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                                 <div className="flex items-center space-x-2">
                   {(() => {
                     const IconComponent = getItemTypeIcon(item.type);
                     return IconComponent && (
                       <div className={`${getItemTypeColor(item.type)} p-2 rounded-lg`}>
                         <IconComponent size={16} className="text-white" />
                       </div>
                     );
                   })()}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit size={16} />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>Views: {item.views.toLocaleString()}</span>
                <span>Clicks: {item.clicks.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.targetAudience}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                  <span className="ml-1">{item.status}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {itemTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setShowCreateModal(true)}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
            >
              <div className={`${type.color} w-8 h-8 rounded-lg mb-2 flex items-center justify-center`}>
                <type.icon size={16} className="text-white" />
              </div>
              <h4 className="font-medium text-gray-900">{type.label}</h4>
              <p className="text-sm text-gray-600 mt-1">Create featured {type.label.toLowerCase()}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderManageTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Manage Featured Items</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border-none focus:ring-0"
            >
              <option value="all">All Types</option>
              {itemTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border-none focus:ring-0"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search featured items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        {item.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                                     <td className="px-6 py-4">
                     <div className="flex items-center space-x-2">
                       {(() => {
                         const IconComponent = getItemTypeIcon(item.type);
                         return IconComponent && (
                           <div className={`${getItemTypeColor(item.type)} p-1 rounded`}>
                             <IconComponent size={12} className="text-white" />
                           </div>
                         );
                       })()}
                       <span className="text-sm text-gray-900">{itemTypes.find(type => type.id === item.type)?.label}</span>
                     </div>
                   </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">{item.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>Views: {item.views.toLocaleString()}</div>
                      <div>Clicks: {item.clicks.toLocaleString()}</div>
                      <div>Revenue: ${item.revenue.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit size={16} />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Eye size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderScheduledTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Scheduled Items</h2>
        <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
          <Download size={16} />
          <span>Export Schedule</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Audience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.filter(item => item.status === 'scheduled').map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(item.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(item.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.targetAudience}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Featured Content Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">45.2K</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Eye size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900">15.6K</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Target size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$89.2K</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">15.2%</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Type</h3>
        <div className="space-y-4">
          {itemTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`${type.color} w-4 h-4 rounded-full`}></div>
                <span className="font-medium text-gray-900">{type.label}</span>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <span className="text-gray-600">Views: 12.3K</span>
                <span className="text-gray-600">Clicks: 4.2K</span>
                <span className="text-gray-600">Revenue: $23.4K</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Items</h3>
          <div className="space-y-4">
            {filteredItems.slice(0, 5).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">${item.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{item.views.toLocaleString()} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe size={16} className="text-gray-500" />
                <span className="text-sm text-gray-900">All Users</span>
              </div>
              <span className="text-sm font-medium text-gray-900">65%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone size={16} className="text-gray-500" />
                <span className="text-sm text-gray-900">Mobile Users</span>
              </div>
              <span className="text-sm font-medium text-gray-900">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor size={16} className="text-gray-500" />
                <span className="text-sm text-gray-900">Desktop Users</span>
              </div>
              <span className="text-sm font-medium text-gray-900">10%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'manage':
        return renderManageTab();
      case 'scheduled':
        return renderScheduledTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Featured Content</h1>
          <p className="text-gray-600 mt-1">Manage and track your featured content performance</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FeaturedPage;
