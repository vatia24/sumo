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
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    // Auto-expand the parent section if an active child is inside
    setExpanded((prev) => ({
      ...prev,
      'products-root': activePage === 'offers' || activePage === 'product-management'
    }));
  }, [activePage]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  type MenuChild = { icon: any; label: string; id: string; active?: boolean };
  type MenuItem = { icon: any; label: string; id: string; active?: boolean; hasArrow?: boolean; badge?: string; children?: MenuChild[] };

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'დეშბორდი', id: 'dashboard', active: activePage === 'dashboard' },
    {
      icon: Package,
      label: 'პროდუქტები',
      id: 'products-root',
      hasArrow: true,
      active: activePage === 'offers' || activePage === 'product-management',
      children: [
        { icon: Tag, label: 'შეთავაზებები', id: 'offers', active: activePage === 'offers' },
        { icon: Package, label: 'პროდუქტის მართვა', id: 'product-management', active: activePage === 'product-management' },
      ]
    },
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
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${isOpen ? 'opacity-100 pointer-events-auto animate-fade' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside className={`fixed md:static inset-y-0 left-0 z-[9999] w-64 bg-sidebar-bg text-sidebar-text flex flex-col sidebar transform transition-transform md:translate-x-0 ${isOpen ? 'translate-x-0 animate-slide-up' : '-translate-x-full'} md:border-r md:border-slate-200 shadow-none overflow-y-auto`} aria-label="Primary Sidebar Navigation">
        <div className="hidden">
          <button className="md:hidden icon-button absolute right-4" onClick={onClose} aria-label="Close sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 flex flex-col justify-evenly">
          {menuItems.map((item, index) => (
            <div key={index} className="relative">
              <button 
                className={`sidebar-item w-full ${item.active ? 'active' : ''}`}
                onClick={() => {
                  if (item.children) {
                    toggleExpand(item.id);
                  } else {
                    onPageChange?.(item.id);
                  }
                }}
                aria-expanded={item.children ? !!expanded[item.id] : undefined}
                aria-controls={item.children ? `${item.id}-submenu` : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8">
                    <item.icon size={24} className="relative top-[2px]" />
                  </div>
                  <span className="truncate relative top-[2px] leading-none">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {item.badge && (
                    <span className="badge bg-green-100 text-green-800">{item.badge}</span>
                  )}
                  {item.hasArrow && (
                    <div className={`flex items-center justify-center transition-transform ${expanded[item.id] ? 'rotate-90' : ''}`}>
                      <ChevronRight size={18} />
                    </div>
                  )}
                </div>
              </button>
              {item.children && expanded[item.id] && (
                <div id={`${item.id}-submenu`} className="ml-10 mt-1 space-y-1 animate-fade">
                  {item.children.map((child, cidx) => (
                    <button
                      key={cidx}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left text-slate-100 hover:bg-blue-600 hover:text-white transition-colors ${child.active ? 'bg-blue-600 text-white' : 'bg-slate-800/40'}`}
                      onClick={() => onPageChange?.(child.id)}
                    >
                      <child.icon size={18} className="relative top-[2px]" />
                      <span className="text-xs relative top-[2px] leading-none">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
