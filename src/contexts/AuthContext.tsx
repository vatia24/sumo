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
        if (token) {
          // You might want to validate the token with the backend here
          // For now, we'll assume the token is valid if it exists
          // You can add a token validation endpoint to your backend
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.authorize(identifier, password);
      setUser(response.user);
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
      const response = await apiService.registerUser(userData);
      setUser(response.user);
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
      const response = await apiService.verifyCustomer(mobile, otp);
      setUser(response.user);
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

