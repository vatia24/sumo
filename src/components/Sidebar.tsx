import React from 'react';
import { 
  LayoutDashboard, 
  Tag, 
  BarChart3, 
  Bell, 
  Star, 
  User, 
  CreditCard, 
  HelpCircle, 
  Settings,
  ChevronRight,
  Coffee,
  Package,
  Building2
} from 'lucide-react';

interface SidebarProps {
  activePage?: string;
  onPageChange?: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage = 'dashboard', onPageChange }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', active: activePage === 'dashboard', badge: '5' },
    { icon: Tag, label: 'Offers', id: 'offers', active: activePage === 'offers' },
    { icon: Package, label: 'Product Management', id: 'product-management', active: activePage === 'product-management' },
    { icon: Building2, label: 'Company Management', id: 'company-management', active: activePage === 'company-management' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics', active: activePage === 'analytics' },
    { icon: Bell, label: 'Push Notifications', id: 'notifications', active: activePage === 'notifications' },
    { icon: Star, label: 'Featured', id: 'featured', active: activePage === 'featured' },
    { icon: User, label: 'Profile', id: 'profile', active: activePage === 'profile' },
    { icon: CreditCard, label: 'Billing', id: 'billing', active: activePage === 'billing' },
    { icon: HelpCircle, label: 'Support', id: 'support', hasArrow: true, active: activePage === 'support' },
    { icon: Settings, label: 'Settings', id: 'settings', hasArrow: true, active: activePage === 'settings' },
  ];

  return (
    <div className="w-64 bg-sidebar-bg text-sidebar-text flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="text-2xl font-bold text-white">COSEN</div>
        <div className="text-sm text-gray-400">DASH</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => (
          <div key={index} className="relative">
            <button 
              className={`sidebar-item w-full ${item.active ? 'active' : ''}`}
              onClick={() => onPageChange?.(item.id)}
            >
              <item.icon size={20} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.hasArrow && <ChevronRight size={16} />}
            </button>
          </div>
        ))}
      </nav>

      {/* Upgrade Card */}
      <div className="p-4">
        <div className="bg-blue-800 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
            <Coffee className="w-full h-full text-blue-300" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-white mb-2">Unlimited Access</h3>
            <p className="text-blue-200 text-sm mb-4">
              Upgrade to plan to get access to unlimited reports.
            </p>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
