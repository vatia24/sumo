import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Flag, 
  HelpCircle, 
  Settings, 
  Moon, 
  ChevronDown,
  Calendar,
  LogOut,
  User
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search something..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">K</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Pages</option>
            </select>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Flag className="text-gray-600" size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <HelpCircle className="text-gray-600" size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="text-gray-600" size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
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
              <div className="text-sm text-left">
                <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
                <div className="text-gray-600 text-xs capitalize">{user?.role || 'user'}</div>
              </div>
              <ChevronDown className="text-gray-400" size={16} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Settings size={16} />
                  <span>Settings</span>
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
      <div className="mt-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Welcome back, {user?.name || 'User'} 👋
        </h1>
      </div>
    </div>
  );
};

export default Header;
