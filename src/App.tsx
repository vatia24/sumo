import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { apiService, Product } from './services/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import OffersTable from './components/OffersTable';
import AnalyticsCharts from './components/AnalyticsCharts';
import AnalyticsPage from './components/AnalyticsPage';
import AllOffersPage from './components/AllOffersPage';
import ProfilePage from './components/ProfilePage';
import AddOfferPage from './components/AddOfferPage';
import PushNotificationsPage from './components/PushNotificationsPage';
import FeaturedPage from './components/FeaturedPage';
import BillingPage from './components/BillingPage';
import LoginPage from './components/LoginPage';
import ProductManagementPage from './components/ProductManagementPage';
import CompanyPage from './components/CompanyPage';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingEditProductId, setPendingEditProductId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Shared products state for dashboard
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Debug authentication state
  console.log('App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user);
  console.log('App render - user type:', typeof user, 'user truthy:', !!user);

  // Fetch products for dashboard
  const fetchProducts = async () => {
    if (!isAuthenticated) return;
    
    try {
      setProductsLoading(true);
      setProductsError(null);
      const response = await apiService.getProducts();
      setProducts(response || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setProductsError(err.message || 'Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch products when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPageContent = () => {
    switch (activePage) {
      case 'offers':
        return <AllOffersPage 
          key={refreshKey}
          onAddNew={() => setActivePage('add-offer')} 
          onProductCreated={() => {
            setRefreshKey(prev => prev + 1);
          }}
          products={products}
          loading={productsLoading}
          error={productsError}
          onRefresh={fetchProducts}
        />;
      case 'add-offer':
        return <AddOfferPage 
          onBack={() => setActivePage('offers')} 
          onProductCreated={() => {
            setRefreshKey(prev => prev + 1);
            setActivePage('offers');
          }}
        />;
      case 'product-management':
        return <ProductManagementPage 
          key={refreshKey}
          onAddNew={() => setActivePage('add-offer')} 
          onProductCreated={() => {
            setRefreshKey(prev => prev + 1);
          }}
          products={products}
          loading={productsLoading}
          error={productsError}
          onRefresh={fetchProducts}
          autoEditProductId={pendingEditProductId}
        />;
      case 'company-management':
        return <CompanyPage 
          onBack={() => setActivePage('dashboard')} 
        />;
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardOverview />
            <OffersTable 
              products={products.filter(p => {
                const hasPercent = (p as any).discount_percent != null && Number((p as any).discount_percent) > 0;
                const isActive = (p as any).discount_status === 'active';
                return hasPercent && isActive;
              })}
              loading={productsLoading}
              error={productsError}
              onRefresh={fetchProducts}
              onEdit={(id) => { setPendingEditProductId(id); setActivePage('product-management'); }}
            />
            {/* Analytics sections removed from main dashboard */}
          </div>
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'notifications':
        return <PushNotificationsPage />;
      case 'featured':
        return <FeaturedPage />;
      case 'billing':
        return <BillingPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return (
          <div className="space-y-6">
            <DashboardOverview />
            <OffersTable 
              products={products}
              loading={productsLoading}
              error={productsError}
              onRefresh={fetchProducts}
            />
            <AnalyticsCharts />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activePage={activePage} 
        onPageChange={(page) => { setActivePage(page); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activePage={activePage} onNavigate={setActivePage} onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 scroll-area">
          <div className="page-container py-6">
            {renderPageContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <AppContent />
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
