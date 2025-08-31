import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

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
    return <LoginPage onLoginSuccess={() => setActivePage('dashboard')} />;
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
        />;
      case 'add-offer':
        return <AddOfferPage 
          onBack={() => setActivePage('offers')} 
          onProductCreated={() => {
            setRefreshKey(prev => prev + 1);
            setActivePage('offers');
          }}
        />;
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardOverview />
            <OffersTable />
            <AnalyticsCharts />
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
            <OffersTable />
            <AnalyticsCharts />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
