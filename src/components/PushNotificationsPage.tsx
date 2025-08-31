import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Clock, 
  Users, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Target,
  BarChart3,
  Settings,
  Filter,
  Search,
  Download
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'promotional' | 'transactional' | 'alert' | 'update';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  targetAudience: string;
  scheduledFor?: string;
  sentAt?: string;
  recipients: number;
  opened: number;
  clicked: number;
  createdAt: string;
}

const PushNotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('compose');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'New Offers Available!',
        message: 'Check out our latest deals and save up to 50% on selected items.',
        type: 'promotional',
        status: 'sent',
        targetAudience: 'All Users',
        sentAt: '2024-01-15T10:30:00Z',
        recipients: 15420,
        opened: 8234,
        clicked: 2341,
        createdAt: '2024-01-15T09:00:00Z'
      },
      {
        id: '2',
        title: 'Order Status Update',
        message: 'Your order #12345 has been shipped and is on its way!',
        type: 'transactional',
        status: 'scheduled',
        targetAudience: 'Order Customers',
        scheduledFor: '2024-01-16T14:00:00Z',
        recipients: 0,
        opened: 0,
        clicked: 0,
        createdAt: '2024-01-15T11:00:00Z'
      },
      {
        id: '3',
        title: 'System Maintenance',
        message: 'We will be performing maintenance on January 20th from 2-4 AM.',
        type: 'alert',
        status: 'draft',
        targetAudience: 'All Users',
        recipients: 0,
        opened: 0,
        clicked: 0,
        createdAt: '2024-01-15T12:00:00Z'
      },
      {
        id: '4',
        title: 'App Update Available',
        message: 'Update to the latest version for new features and improvements.',
        type: 'update',
        status: 'sent',
        targetAudience: 'Mobile Users',
        sentAt: '2024-01-14T16:00:00Z',
        recipients: 8920,
        opened: 4456,
        clicked: 1234,
        createdAt: '2024-01-14T15:00:00Z'
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const tabs = [
    { id: 'compose', label: 'Compose', icon: Plus },
    { id: 'scheduled', label: 'Scheduled', icon: Clock },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'templates', label: 'Templates', icon: Edit },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const notificationTypes = [
    { id: 'promotional', label: 'Promotional', color: 'bg-blue-500' },
    { id: 'transactional', label: 'Transactional', color: 'bg-green-500' },
    { id: 'alert', label: 'Alert', color: 'bg-red-500' },
    { id: 'update', label: 'Update', color: 'bg-purple-500' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle size={16} />;
      case 'scheduled': return <Clock size={16} />;
      case 'draft': return <Edit size={16} />;
      case 'failed': return <XCircle size={16} />;
      default: return <Edit size={16} />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || notification.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const renderComposeTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Compose New Notification</h2>
        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>New Notification</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold text-gray-900">24.3K</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">53.4%</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Eye size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Click Rate</p>
              <p className="text-2xl font-bold text-gray-900">15.2%</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Target size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Templates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {notificationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setShowComposeModal(true)}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
            >
              <div className={`${type.color} w-8 h-8 rounded-lg mb-2 flex items-center justify-center`}>
                <Bell size={16} className="text-white" />
              </div>
              <h4 className="font-medium text-gray-900">{type.label}</h4>
              <p className="text-sm text-gray-600 mt-1">Create {type.label.toLowerCase()} notification</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderScheduledTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Scheduled Notifications</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border-none focus:ring-0"
            >
              <option value="all">All Types</option>
              {notificationTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
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
                  placeholder="Search notifications..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled For</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotifications.filter(n => n.status === 'scheduled').map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{notification.message}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      notification.type === 'promotional' ? 'bg-blue-100 text-blue-800' :
                      notification.type === 'transactional' ? 'bg-green-100 text-green-800' :
                      notification.type === 'alert' ? 'bg-red-100 text-red-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {notification.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{notification.targetAudience}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {notification.scheduledFor ? new Date(notification.scheduledFor).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                      {getStatusIcon(notification.status)}
                      <span className="ml-1">{notification.status}</span>
                    </span>
                  </td>
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

  const renderSentTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Sent Notifications</h2>
        <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
          <Download size={16} />
          <span>Export Data</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opened</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotifications.filter(n => n.status === 'sent').map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{notification.message}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{notification.recipients.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {notification.opened.toLocaleString()} ({(notification.opened / notification.recipients * 100).toFixed(1)}%)
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {notification.clicked.toLocaleString()} ({(notification.clicked / notification.recipients * 100).toFixed(1)}%)
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {notification.sentAt ? new Date(notification.sentAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Notification Templates</h2>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          <span>New Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Welcome Message', type: 'promotional', description: 'Welcome new users to the platform' },
          { name: 'Order Confirmation', type: 'transactional', description: 'Confirm order placement and details' },
          { name: 'Price Drop Alert', type: 'promotional', description: 'Notify users about price reductions' },
          { name: 'App Update', type: 'update', description: 'Inform users about new app features' },
          { name: 'Maintenance Notice', type: 'alert', description: 'Notify about scheduled maintenance' },
          { name: 'Special Offer', type: 'promotional', description: 'Promote limited-time offers' }
        ].map((template, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-900">
                  <Edit size={16} />
                </button>
                <button className="text-red-600 hover:text-red-900">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              template.type === 'promotional' ? 'bg-blue-100 text-blue-800' :
              template.type === 'transactional' ? 'bg-green-100 text-green-800' :
              template.type === 'alert' ? 'bg-red-100 text-red-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {template.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Notification Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Send size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">53.4%</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Eye size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Click Rate</p>
              <p className="text-2xl font-bold text-gray-900">15.2%</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Target size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">8.7%</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <CheckCircle size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Type</h3>
        <div className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`${type.color} w-4 h-4 rounded-full`}></div>
                <span className="font-medium text-gray-900">{type.label}</span>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <span className="text-gray-600">Sent: 234</span>
                <span className="text-gray-600">Open: 45.2%</span>
                <span className="text-gray-600">Click: 12.8%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'compose':
        return renderComposeTab();
      case 'scheduled':
        return renderScheduledTab();
      case 'sent':
        return renderSentTab();
      case 'templates':
        return renderTemplatesTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderComposeTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-600 mt-1">Manage and send push notifications to your users</p>
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

export default PushNotificationsPage;
