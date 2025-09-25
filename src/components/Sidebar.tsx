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
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage = 'dashboard', onPageChange, isOpen = false, onClose }) => {
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
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-sidebar-bg text-sidebar-text flex flex-col sidebar transform transition-transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="text-3xl font-bold text-white">სუმო</div>
          <button className="md:hidden icon-button" onClick={onClose} aria-label="Close sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item, index) => (
            <div key={index} className="relative">
              <button 
                className={`sidebar-item w-full ${item.active ? 'active' : ''}`}
                onClick={() => onPageChange?.(item.id)}
              >
                <div className="flex items-center justify-center w-8 h-8">
                  <item.icon size={24} />
                </div>
                <span className="flex-1 text-lg md:text-xl font-medium">{item.label}</span>
                {item.badge && (
                  <span className="badge bg-green-100 text-green-800">{item.badge}</span>
                )}
                {item.hasArrow && (
                  <div className="flex items-center justify-center">
                    <ChevronRight size={18} />
                  </div>
                )}
              </button>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
