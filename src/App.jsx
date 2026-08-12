import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import DemoModal from './components/DemoModal';
import LoginModal from './components/LoginModal';

// Marketing / Landing Pages
import PlatformPage from './pages/PlatformPage';
import HealthcarePage from './pages/HealthcarePage';
import TechnologyPage from './pages/TechnologyPage';
import ImpactPage from './pages/ImpactPage';
import LoginPage from './pages/LoginPage';

// App Views (Inside Console)
import DashboardView from './views/DashboardView';
import ShipmentsView from './views/ShipmentsView';
import ShipmentDetailsView from './views/ShipmentDetailsView';
import AIPredictionView from './views/AIPredictionView';
import DecisionCenterView from './views/DecisionCenterView';
import WarehousesView from './views/WarehousesView';
import AlertsView from './views/AlertsView';
import AnalyticsView from './views/AnalyticsView';
import ProfileView from './views/ProfileView';

const STORAGE_KEY = 'cryoflow_user_profile';

export default function App() {
  const [activeTab, setActiveTab] = useState('platform');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // User Session State initialized from browser localStorage (cache memory)
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [selectedShipmentId, setSelectedShipmentId] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
    setActiveTab('dashboard');
  };

  const handleUpdateUser = (updatedUserData) => {
    setUser(updatedUserData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserData));
    } catch (e) {
      console.error('LocalStorage update error:', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('LocalStorage remove error:', e);
    }
    setActiveTab('platform');
  };

  const handleSelectShipment = (id) => {
    setSelectedShipmentId(id);
    setActiveTab('shipment-details');
  };

  const handleNavigateToPrediction = (id) => {
    setSelectedShipmentId(id);
    setActiveTab('prediction');
  };

  const handleNavigateToDecision = (id) => {
    setSelectedShipmentId(id);
    setActiveTab('decision');
  };

  // Check if current tab is inside the enterprise app console
  const isConsoleTab = ['dashboard', 'shipments', 'shipment-details', 'prediction', 'decision', 'warehouses', 'alerts', 'analytics', 'profile'].includes(activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-body-md antialiased selection:bg-primary-container selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        user={user}
        onLogout={handleLogout}
        isConsoleTab={isConsoleTab}
      />

      {/* Main Content Render */}
      {isConsoleTab ? (
        <div className="flex-grow pt-[72px] flex w-full">
          {/* Sidebar Navigation */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            onLogout={handleLogout}
          />

          {/* Main Console View Canvas */}
          <main className="flex-grow p-4 md:p-6 overflow-y-auto w-full">
            {activeTab === 'dashboard' && (
              <DashboardView
                onSelectShipment={handleSelectShipment}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'shipments' && (
              <ShipmentsView
                onSelectShipment={handleSelectShipment}
              />
            )}

            {activeTab === 'shipment-details' && (
              <ShipmentDetailsView
                shipmentId={selectedShipmentId || 'CRY-8842'}
                onBack={() => setActiveTab('shipments')}
                onNavigateToPrediction={handleNavigateToPrediction}
                onNavigateToDecision={handleNavigateToDecision}
              />
            )}

            {activeTab === 'prediction' && (
              <AIPredictionView
                initialShipmentId={selectedShipmentId}
                onNavigateToDecision={handleNavigateToDecision}
              />
            )}

            {activeTab === 'decision' && (
              <DecisionCenterView
                onNavigateToDashboard={() => setActiveTab('dashboard')}
                onNavigateToShipments={() => setActiveTab('shipments')}
                onSelectShipment={handleSelectShipment}
              />
            )}

            {activeTab === 'warehouses' && (
              <WarehousesView />
            )}

            {activeTab === 'alerts' && (
              <AlertsView />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                user={user}
                onUpdateUser={handleUpdateUser}
                onLogout={handleLogout}
              />
            )}
          </main>
        </div>
      ) : (
        /* Public Marketing / Landing Views */
        <main className="flex-grow pt-[88px] max-w-7xl mx-auto w-full px-md md:px-lg pb-xl">
          {activeTab === 'platform' && (
            <PlatformPage
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenDemo={() => setIsDemoOpen(true)}
            />
          )}

          {activeTab === 'healthcare' && (
            <HealthcarePage
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenDemo={() => setIsDemoOpen(true)}
            />
          )}

          {activeTab === 'technology' && (
            <TechnologyPage
              onOpenDemo={() => setIsDemoOpen(true)}
            />
          )}

          {activeTab === 'impact' && (
            <ImpactPage
              onOpenDemo={() => setIsDemoOpen(true)}
            />
          )}

          {activeTab === 'login' && (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
        </main>
      )}

      {/* Footer */}
      {!isConsoleTab && (
        <Footer
          setActiveTab={setActiveTab}
          onOpenDemo={() => setIsDemoOpen(true)}
        />
      )}

      {/* Modals */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
