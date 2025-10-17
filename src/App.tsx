import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Location } from 'react-router-dom';
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
import { ToastProvider } from './components/ToastProvider';
import { useI18n } from './i18n';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  // Derive active page from URL path for header/sidebar/breadcrumb
  const path = location.pathname;
  const activePage = (
    path.startsWith('/offers') ? 'offers' :
    path.startsWith('/products') ? 'product-management' :
    path.startsWith('/company') ? 'company-management' :
    path.startsWith('/analytics') ? 'analytics' :
    path.startsWith('/notifications') ? 'notifications' :
    path.startsWith('/featured') ? 'featured' :
    path.startsWith('/billing') ? 'billing' :
    path.startsWith('/profile') ? 'profile' :
    'dashboard'
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingEditProductId, setPendingEditProductId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Modal routing support
  const isAddRoute = path === '/add-offer';
  const state = location.state as { background?: Location } | undefined;
  const background = state && state.background ? state.background : undefined;
  
  // Shared products state for dashboard
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Debug authentication state (only in debug mode)
  if (process.env.REACT_APP_DEBUG === 'true') {
    console.log('App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user);
    console.log('App render - user type:', typeof user, 'user truthy:', !!user);
  }

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

  // Global refresh event handler (from header)
  React.useEffect(() => {
    const handler = () => {
      if (activePage === 'dashboard' || activePage === 'offers' || activePage === 'product-management') {
        fetchProducts();
      }
    };
    window.addEventListener('app:refresh', handler as EventListener);
    return () => window.removeEventListener('app:refresh', handler as EventListener);
  }, [activePage]);

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
  // Navigation helpers
  const go = (page: string) => {
    const map: Record<string, string> = {
      'dashboard': '/dashboard',
      'offers': '/offers',
      'product-management': '/products',
      'company-management': '/company',
      'analytics': '/analytics',
      'notifications': '/notifications',
      'featured': '/featured',
      'billing': '/billing',
      'profile': '/profile',
    };
    navigate(map[page] || '/dashboard');
  };

  const openAddModal = () => {
    navigate('/add-offer', { state: { background: location } });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        activePage={activePage} 
        onPageChange={(page) => { go(page); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Accessibility: Skip link target */}
        <a href="#main" className="skip-link">Skip to main content</a>
        <Header activePage={activePage} onNavigate={go} onOpenSidebar={() => setIsSidebarOpen(true)} onOpenAddModal={openAddModal} />
        {/* Breadcrumb moved into page content */}
        <main id="main" className="flex-1 scroll-area" role="main">
          <div className="page-container py-6">
            <nav aria-label="Breadcrumb" className="pb-4">
              {activePage === 'dashboard' ? (
                <ol className="flex items-center text-sm text-gray-500">
                  <li className="flex items-center">
                    <span className="text-gray-600">{t('nav.dashboard')}</span>
                    <span className="mx-2 text-gray-400">›</span>
                  </li>
                </ol>
              ) : (
                <ol className="flex items-center text-sm text-gray-500">
                  <li className="flex items-center">
                    <button onClick={() => go('dashboard')} className="text-gray-600 hover:text-blue-600">{t('nav.dashboard')}</button>
                  </li>
                  <span className="mx-2 text-gray-400">›</span>
                  <li className="flex items-center">
                    <span className="text-gray-500 capitalize">{
                      (() => {
                        switch (activePage) {
                          case 'offers': return t('nav.offers');
                          case 'product-management': return t('nav.productManagement');
                          case 'company-management': return t('nav.companyManagement');
                          case 'analytics': return t('nav.analytics');
                          case 'notifications': return t('nav.notifications');
                          case 'featured': return t('nav.featured');
                          case 'billing': return t('nav.billing');
                          case 'profile': return t('nav.profile');
                          default: return t('nav.dashboard');
                        }
                      })()
                    }</span>
                  </li>
                </ol>
              )}
            </nav>
            {/* Base routes; if modal route is active, render background location under it */}
            <Routes location={background || (isAddRoute ? { ...(location as any), pathname: '/offers' } as any : location)}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <div className="space-y-6 animate-fade">
                  <DashboardOverview />
                  <OffersTable 
                    products={products}
                    loading={productsLoading}
                    error={productsError}
                    onRefresh={fetchProducts}
                    onEdit={(id) => { setPendingEditProductId(id); }}
                    onAdd={openAddModal}
                  />
                  {pendingEditProductId !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-auto bg-white rounded-xl shadow-xl p-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
                          <button className="px-3 py-1 rounded-lg text-gray-700 hover:bg-gray-100" onClick={() => setPendingEditProductId(null)}>Close</button>
                        </div>
                        <ProductManagementPage 
                          key={refreshKey}
                          onAddNew={openAddModal}
                          onProductCreated={() => { setRefreshKey(prev => prev + 1); fetchProducts(); }}
                          products={products}
                          loading={productsLoading}
                          error={productsError}
                          onRefresh={fetchProducts}
                          autoEditProductId={pendingEditProductId}
                          embedded={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              } />
              <Route path="/offers" element={
                <div className="animate-fade">
                  <AllOffersPage 
                    key={refreshKey}
                    onAddNew={openAddModal}
                    onProductCreated={() => { setRefreshKey(prev => prev + 1); }}
                    products={products}
                    loading={productsLoading}
                    error={productsError}
                    onRefresh={fetchProducts}
                  />
                </div>
              } />
              <Route path="/products" element={
                <div className="animate-fade">
                  <ProductManagementPage 
                    key={refreshKey}
                    onAddNew={openAddModal}
                    onProductCreated={() => { setRefreshKey(prev => prev + 1); }}
                    products={products}
                    loading={productsLoading}
                    error={productsError}
                    onRefresh={fetchProducts}
                    autoEditProductId={pendingEditProductId}
                  />
                </div>
              } />
              <Route path="/company" element={<div className="animate-fade"><CompanyPage onBack={() => go('dashboard')} /></div>} />
              <Route path="/analytics" element={<div className="animate-fade"><AnalyticsPage /></div>} />
              <Route path="/notifications" element={<div className="animate-fade"><PushNotificationsPage /></div>} />
              <Route path="/featured" element={<div className="animate-fade"><FeaturedPage /></div>} />
              <Route path="/billing" element={<div className="animate-fade"><BillingPage /></div>} />
              <Route path="/profile" element={<div className="animate-fade"><ProfilePage /></div>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            {/* Modal routes rendered on top */}
            {(isAddRoute || background) && (
              <Routes>
                <Route path="/add-offer" element={
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade">
                    <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto bg-white rounded-xl shadow-xl p-4 animate-slide-up">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Add Offer</h3>
                        <button className="px-3 py-1 rounded-lg text-gray-700 hover:bg-gray-100" onClick={() => navigate(-1)}>Close</button>
                      </div>
                      <AddOfferPage 
                        onBack={() => navigate(-1)} 
                        onProductCreated={() => { setRefreshKey(prev => prev + 1); navigate(-1); fetchProducts(); }}
                      />
                    </div>
                  </div>
                } />
              </Routes>
            )}
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
