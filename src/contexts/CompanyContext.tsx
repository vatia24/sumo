import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, Company } from '../services/api';
import { useAuth } from './AuthContext';

interface CompanyContextType {
  company: Company | null;
  loading: boolean;
  error: string | null;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCompany = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('CompanyContext: refreshCompany called - fetching company data...');
      const companyData = await apiService.getUserCompany();
      console.log('CompanyContext: Company data received:', companyData);
      setCompany(companyData);
    } catch (err: any) {
      console.error('CompanyContext: Error fetching company:', err);
      setError(err.message || 'Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCompany(null);
      setError(null);
    }
    // Don't automatically fetch company data on authentication
    // It will be fetched when needed (e.g., when company page is accessed)
  }, [isAuthenticated]);

  const value: CompanyContextType = {
    company,
    loading,
    error,
    refreshCompany
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
