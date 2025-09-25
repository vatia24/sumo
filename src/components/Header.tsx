import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Flag, 
  HelpCircle, 
  Settings, 
  Moon, 
  ChevronDown,
  LogOut,
  User
} from 'lucide-react';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  activePage?: string;
  onOpenSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, activePage = 'dashboard', onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const breadcrumbItems = React.useMemo(() => {
    const items: { label: React.ReactNode; page?: string }[] = [
      {
        label: (
          <svg width="34" height="30" className="mr-2 align-middle" viewBox="0 0 242 211" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_483_936)">
              <path d="M203.575 177.203C203.414 177.542 203.778 178.118 203.694 178.254C197.239 188.545 181.441 197.169 169.887 200.608C146.017 207.698 106.603 205.775 85.4768 191.917C80.5468 188.681 78.641 186.292 76.5995 180.642C69.9246 162.176 70.7717 128.92 76.9722 110.31C78.1751 106.693 80.0894 103.296 80.9704 99.5609C82.5544 99.9251 83.8081 100.772 85.4429 101.247C88.0942 102.009 91.8722 102.746 94.6505 103.254C122.434 108.353 173.834 108.87 199.822 97.2908C200.737 96.8842 202.084 95.3933 203.041 96.0032C207.455 105.736 207.531 116.46 207.082 126.955C206.514 133.045 204.21 137.882 205.76 144.074C209.022 157.128 209.598 164.76 203.583 177.22L203.575 177.203Z" fill="#FFDCE7"/>
              <path d="M122.189 132.8C114.921 130.826 107.501 129.445 100.216 127.523C98.2423 126.997 94.0155 124.532 92.8719 126.947C91.9571 128.878 93.6936 130.42 95.2522 131.368C96.6668 132.232 98.4202 132.181 99.8433 132.58C101.893 133.156 104.096 134.172 106.349 134.265C101.902 140.957 107.746 152.316 116.361 149.309C117.869 148.784 120.495 146.234 121.189 144.811C122.316 142.499 122.02 140.119 122.028 137.628C122.655 136.959 132.71 141.499 134.463 140.94C135.412 140.635 135.674 138.865 135.276 138.009C134.294 135.883 124.722 133.494 122.18 132.808L122.189 132.8Z" fill="black"/>
              <path d="M194.74 124.295C188.666 126.006 171.64 131.301 167.109 134.655C164.788 136.374 162.475 140.678 167.159 140.279C168.557 150.715 180.018 151.283 183.508 141.44C184.609 138.348 183.703 136.086 182.881 133.156C183.245 133.283 183.474 133.376 183.864 133.24C186.888 132.207 189.81 130.869 192.876 129.911C195.13 129.208 196.663 129.835 198.543 127.743C199.611 126.557 200.026 125.82 198.704 124.6C197.366 123.364 196.299 123.872 194.74 124.304V124.295Z" fill="black"/>
              <path d="M101.495 117.663C107.085 119.289 113.091 123.016 118.479 125.32C121.638 126.667 134.336 132.046 136.97 131.14C139.85 130.149 139.875 125.6 136.546 124.388C135.903 124.151 135.378 124.465 134.802 124.304C128.22 122.5 121.714 120.5 115.505 118.12L115.166 117.663C110.652 116.121 98.6232 109.294 94.8961 114.241C92.8378 116.977 99.8684 117.197 101.495 117.671V117.663Z" fill="black"/>
              <path d="M163.28 129.81C166.092 130.301 173.944 125.642 176.503 123.973C181.416 120.755 186.125 116.036 190.911 113.004C192.309 112.123 197.171 110.929 193.969 108.252C192.504 107.024 191.14 107.735 189.641 108.379C181.56 111.869 174.817 119.636 165.321 123.253C163.026 124.126 160.9 123.16 160.967 126.701C160.984 127.599 162.407 129.666 163.28 129.818V129.81Z" fill="black"/>
              <path d="M161.145 175.721C160.883 175.848 160.798 176.221 160.688 176.271C153.657 179.541 148.126 180.109 140.968 177.059C139.935 176.619 136.021 173.552 135.852 176.585C135.572 181.633 146.364 183.844 150.201 183.683C153.886 183.531 161.764 181.303 164.754 179.033C165.898 178.16 167.549 176.077 166.431 174.755C164.974 173.019 162.84 174.891 161.154 175.729L161.145 175.721Z" fill="black"/>
              <path d="M158.604 160.211C157.579 161.592 156.249 162.422 156.792 164.472C160.841 165.996 165.762 161.422 163.263 157.433C161.179 154.095 155.089 154.146 151.743 155.213C150.523 155.603 149.422 156.289 149.812 157.805C150.786 161.575 156.368 157.992 158.604 160.211Z" fill="black"/>
              <path d="M217.399 95.0714C210.013 74.8857 198.391 57.1736 180.501 45.196C163.958 34.1164 145.924 29.4321 126.941 28.4664C127.78 24.9087 128.093 21.3765 127.83 18.1153C126.56 2.46991 112.778 -1.03695 90.4662 0.775775C68.146 2.5885 45.741 9.02622 47.0116 24.6631C47.5029 30.7196 51.4757 37.259 57.456 42.9005C43.5641 51.2695 32.1625 63.4842 23.37 80.2138C17.8047 90.7937 12.4682 103.161 8.27523 114.376C1.62575 132.139 -7.60729 161.016 10.9096 174.831C12.2734 175.848 16.585 180.871 36.0845 186.809C55.584 192.738 69.4251 193.679 74.4651 193.628C75.3461 193.628 76.2355 193.136 77.0317 193.238C78.1668 193.382 84.4012 197.838 86.1292 198.736C115.641 214.059 161.628 214.084 190.48 197.279C192.733 195.966 195.486 194.204 197.324 192.484L202.296 188.206L205.185 185.115C213.308 183.895 221.355 181.964 228.555 177.872C232.257 175.772 241.236 168.927 241.109 164.345C239.305 158.94 237.568 153.485 235.713 148.072C229.648 130.36 223.812 112.546 217.416 95.0629L217.399 95.0714ZM203.575 177.203C203.414 177.542 203.779 178.118 203.694 178.253C197.239 188.545 181.441 197.168 169.887 200.608C146.017 207.698 106.603 205.775 85.477 191.917C80.5471 188.681 78.6412 186.292 76.5997 180.642C69.9248 162.176 70.7719 128.92 76.9724 110.31C78.1753 106.693 80.0896 103.296 80.9706 99.5608C82.5546 99.9251 83.8083 100.772 85.4431 101.247C88.0944 102.009 91.8724 102.746 94.6507 103.254C122.435 108.353 173.835 108.87 199.823 97.2907C200.738 96.8841 202.084 95.3933 203.042 96.0032C207.455 105.736 207.531 116.46 207.082 126.955C206.515 133.045 204.211 137.882 205.761 144.074C209.022 157.128 209.598 164.76 203.584 177.22L203.575 177.203Z" fill="black"/>
              <path d="M136.784 176.695C136.784 176.695 141.807 182.472 151.32 181.769C160.832 181.057 166.423 174.747 166.423 174.747" stroke="black" strokeWidth="4.23534" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <defs>
              <clipPath id="clip0_483_936">
                <rect width="241.101" height="209.726" fill="white" transform="translate(-0.00927734 0.343842)"/>
              </clipPath>
            </defs>
          </svg>
        ),
        page: 'dashboard',
      },
      { label: 'Dashboard', page: 'dashboard' },
    ];

    if (activePage !== 'dashboard') {
      switch (activePage) {
        case 'add-offer':
          items.push({ label: 'Add Products' });
          break;
        case 'product-management':
          items.push({ label: 'Product Management' });
          break;
        case 'offers':
          items.push({ label: 'Offers' });
          break;
        case 'company-management':
          items.push({ label: 'Company Management' });
          break;
        case 'analytics':
          items.push({ label: 'Analytics' });
          break;
        case 'notifications':
          items.push({ label: 'Push Notifications' });
          break;
        case 'featured':
          items.push({ label: 'Featured' });
          break;
        case 'billing':
          items.push({ label: 'Billing' });
          break;
        case 'profile':
          items.push({ label: 'Profile' });
          break;
        default:
          break;
      }
    }

    return items;
  }, [activePage]);

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button className="md:hidden icon-button" onClick={onOpenSidebar} aria-label="Open sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-base text-gray-600">
              {breadcrumbItems.map((item, index) => (
                <li key={index} className={`flex items-center ${index > 0 ? 'ml-2' : ''}`}>
                  {item.page && index < breadcrumbItems.length - 1 ? (
                    <button
                      onClick={() => onNavigate?.(item.page!)}
                      className="text-gray-700 hover:text-blue-600"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-gray-500">{item.label}</span>
                  )}
                  {index > 0 && index < breadcrumbItems.length - 1 && (
                    <span className="mx-2 text-gray-400">›</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button className="icon-button">
            <Flag className="text-gray-600" size={20} />
          </button>
          <button className="icon-button">
            <HelpCircle className="text-gray-600" size={20} />
          </button>
          <button className="icon-button">
            <Settings className="text-gray-600" size={20} />
          </button>
          <button className="icon-button">
            <Moon className="text-gray-600" size={20} />
          </button>
          
          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getUserInitials(user?.name)}
              </div>
              <div className="hidden sm:block text-sm text-left">
                <div className="font-medium text-gray-900">{user?.name || 'მომხმარებელი'}</div>
                <div className="text-gray-600 text-xs capitalize">{user?.role || 'user'}</div>
              </div>
              <ChevronDown className="text-gray-400 hidden sm:block" size={16} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={handleProfileClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <User size={16} />
                  <span>პროფილი</span>
                </button>
                <button
                  onClick={handleSettingsClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Settings size={16} />
                  <span>პარამეტრები</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
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
