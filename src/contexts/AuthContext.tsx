import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: {
    username: string;
    name: string;
    email: string;
    mobile: string;
    password: string;
    type: 'customer' | 'owner';
  }) => Promise<void>;
  verifyCustomer: (mobile: string, otp: string) => Promise<void>;
  requestPasswordReset: (identifier: string) => Promise<void>;
  confirmPasswordReset: (identifier: string, otp: string, new_password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem('auth_token');
        console.log('Initial auth check - token exists:', !!token);
        if (token) {
          // Decode the JWT token to get user information
          try {
            console.log('Decoding existing token...');
            const user = apiService.decodeJWTToken(token);
            console.log('Existing token decoded successfully, user:', user);
            setUser(user);
            console.log('User set in state, isAuthenticated should be true');
          } catch (error) {
            console.error('Error decoding token:', error);
            // Token is invalid, clear it
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
          }
        } else {
          console.log('No existing token found');
        }
        setIsLoading(false);
        console.log('Auth check completed, isLoading set to false');
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoading(false);
      }
    };

    console.log('AuthContext useEffect running - starting auth check');
    checkAuth();

    // Listen for logout events from API service
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Starting login process...');
      const response = await apiService.authorize(identifier, password);
      console.log('Login response received:', response);
      console.log('Setting user:', response.user);
      setUser(response.user);
      console.log('User state updated, user:', response.user);
      console.log('isAuthenticated will be:', !!response.user);
      
      // Check if token was stored
      const storedToken = localStorage.getItem('auth_token');
      console.log('Token stored in localStorage:', !!storedToken);
      if (storedToken) {
        console.log('Stored token preview:', storedToken.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      // Clear tokens from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  };

  const register = async (userData: {
    username: string;
    name: string;
    email: string;
    mobile: string;
    password: string;
    type: 'customer' | 'owner';
  }) => {
    try {
      setIsLoading(true);
      await apiService.registerUser(userData);
      // Registration successful, but no user data returned
      // User will need to verify their account before they can log in
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCustomer = async (mobile: string, otp: string) => {
    try {
      setIsLoading(true);
      await apiService.verifyCustomer(mobile, otp);
      // Verification successful, but no user data returned
      // User will need to log in after verification
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (identifier: string) => {
    try {
      await apiService.requestPasswordReset(identifier);
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  };

  const confirmPasswordReset = async (identifier: string, otp: string, new_password: string) => {
    try {
      await apiService.confirmPasswordReset(identifier, otp, new_password);
    } catch (error) {
      console.error('Password reset confirmation failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    verifyCustomer,
    requestPasswordReset,
    confirmPasswordReset,
  };

  // Debug authentication state changes
  console.log('AuthContext render - user:', user, 'isAuthenticated:', !!user, 'isLoading:', isLoading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

