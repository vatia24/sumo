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
    { icon: LayoutDashboard, label: 'დეშბორდი', id: 'dashboard', active: activePage === 'dashboard', badge: '5' },
    { icon: Tag, label: 'შეთავაზებები', id: 'offers', active: activePage === 'offers' },
    { icon: Package, label: 'პროდუქტის მართვა', id: 'product-management', active: activePage === 'product-management' },
    { icon: Building2, label: 'კომპანიის მართვა', id: 'company-management', active: activePage === 'company-management' },
    { icon: BarChart3, label: 'ანალიტიკა', id: 'analytics', active: activePage === 'analytics' },
    { icon: Bell, label: 'შეტყობინებები', id: 'notifications', active: activePage === 'notifications' },
    { icon: Star, label: 'გამორჩეული', id: 'featured', active: activePage === 'featured' },
    { icon: User, label: 'პროფილი', id: 'profile', active: activePage === 'profile' },
    { icon: CreditCard, label: 'ბილინგი', id: 'billing', active: activePage === 'billing' },
    { icon: HelpCircle, label: 'მხარდაჭერა', id: 'support', hasArrow: true, active: activePage === 'support' },
    { icon: Settings, label: 'პარამეტრები', id: 'settings', hasArrow: true, active: activePage === 'settings' },
  ];

  return (
    <div className="w-64 bg-sidebar-bg text-sidebar-text flex flex-col sidebar">
    
      <div className="ml-7">
        <div className="text-6xl font-bold text-white">სუმო</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item, index) => (
          <div key={index} className="relative">
            <button 
              className={`sidebar-item w-full ${item.active ? 'active' : ''}`}
              onClick={() => onPageChange?.(item.id)}
            >
              <div className="flex items-center justify-center w-8 h-8 mt-3">
                <item.icon size={32} />
              </div>
              <span className="flex-1 text-center">{item.label}</span>
              {item.badge && (
                <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.hasArrow && (
                <div className="flex items-center justify-center">
                  <ChevronRight size={24} />
                </div>
              )}
            </button>
          </div>
        ))}
      </nav>

    </div>
  );
};

export default Sidebar;
