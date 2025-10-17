import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { 
  HelpCircle, 
  Settings, 
  Moon, 
  ChevronDown,
  LogOut,
  User,
  Bell,
  RefreshCw,
  Sun
} from 'lucide-react';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  activePage?: string;
  onOpenSidebar?: () => void;
  onOpenAddModal?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, activePage = 'dashboard', onOpenSidebar, onOpenAddModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { company, refreshCompany } = useCompany();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [showNotif, setShowNotif] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    onNavigate?.('profile');
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    onNavigate?.('profile');
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setDark(false);
      localStorage.removeItem('theme');
    } else {
      html.classList.add('dark');
      setDark(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  // Load company name for header when authenticated
  React.useEffect(() => {
    if (isAuthenticated && !company) {
      void refreshCompany();
    }
  }, [isAuthenticated, company, refreshCompany]);

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = React.useMemo(() => {
    const compName = company?.full_name?.trim();
    if (compName) return compName;
    const name = user?.name?.trim();
    if (name) return name;
    if (user?.mobile) return user.mobile;
    if (user?.identifier) return user.identifier;
    return '';
  }, [company, user]);

  const subtitle = React.useMemo(() => {
    if (user?.email) return user.email;
    return '';
  }, [user]);

  // Breadcrumb moved to App.tsx

  return (
    <div className="navbar px-4 sm:px-6 py-3 shadow-sm z-40 animate-fade">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Left column */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button */}
          <button className="md:hidden icon-button" onClick={onOpenSidebar} aria-label="Open sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Page title */}
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {(() => {
                switch (activePage) {
                  case 'dashboard': return 'დეშბორდი';
                  case 'offers': return 'შეთავაზებები';
                  case 'product-management': return 'პროდუქტის მართვა';
                  case 'company-management': return 'კომპანიის მართვა';
                  case 'analytics': return 'ანალიტიკა';
                  case 'notifications': return 'შეტყობინებები';
                  case 'featured': return 'გამორჩეული';
                  case 'billing': return 'ბილინგი';
                  case 'profile': return 'პროფილი';
                  default: return 'სუმო';
                }
              })()}
            </h1>
            {/* spacer inside left column */}
          </div>
        </div>

        {/* Middle column (search) */}
        <div className="hidden lg:flex items-center justify-center">
          <input
            className="input h-9 w-full max-w-sm"
            placeholder="ძიება..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // could navigate to offers or a search page later
              }
            }}
          />
        </div>

        {/* Right column */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {/* Primary action */}
          {(activePage === 'offers' || activePage === 'product-management' || activePage === 'dashboard') && (
            <button className="btn-primary hidden sm:inline-flex" onClick={() => onOpenAddModal ? onOpenAddModal() : onNavigate?.('add-offer')}>
              ახალი შეთავაზება
            </button>
          )}
          {/* Refresh */}
          <button className="icon-button" onClick={() => window.dispatchEvent(new CustomEvent('app:refresh'))} title="Refresh">
            <RefreshCw className="text-gray-600" size={18} />
          </button>
          {/* Notifications */}
          <div className="relative">
            <button className="icon-button" onClick={() => setShowNotif(v => !v)} title="Notifications">
              <Bell className="text-gray-600" size={18} />
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-72 popover z-50 animate-slide-up">
                <div className="px-3 py-2 text-sm text-gray-700 font-medium">Notifications</div>
                <div className="px-3 py-2 text-sm text-gray-500">No new notifications</div>
              </div>
            )}
          </div>
          {/* Help */}
          <button className="icon-button" onClick={() => onNavigate?.('help')} title="Help">
            <HelpCircle className="text-gray-600" size={18} />
          </button>
          {/* Settings */}
          <button className="icon-button" onClick={handleSettingsClick} title="Settings">
            <Settings className="text-gray-600" size={18} />
          </button>
          {/* Theme toggle */}
          <button className="icon-button" onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun className="text-gray-600" size={18} /> : <Moon className="text-gray-600" size={18} />}
          </button>
          
          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getUserInitials(displayName)}
              </div>
              <div className="hidden sm:block text-sm text-left">
                <div className="font-medium text-gray-900">{displayName}</div>
                {subtitle && (
                  <div className="text-gray-600 text-xs">{subtitle}</div>
                )}
              </div>
              <ChevronDown className="text-gray-400 hidden sm:block" size={16} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 popover z-50 animate-slide-up">
                <button onClick={handleProfileClick} className="menu-item">
                  <User size={16} />
                  <span>პროფილი</span>
                </button>
                <button onClick={handleSettingsClick} className="menu-item">
                  <Settings size={16} />
                  <span>პარამეტრები</span>
                </button>
                <div className="my-1 h-px bg-gray-200" />
                <button onClick={handleLogout} className="menu-item text-red-600 hover:bg-red-50">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb moved out to App.tsx under header */}
      
      {/* Welcome message */}
      {/* <div className="mt-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Welcome back, {user?.name || 'მომხმარებელი'} 👋
        </h1>
      </div> */}
    </div>
  );
};

export default Header;
