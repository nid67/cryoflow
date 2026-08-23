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

const STORAGE_KEY = 'valtway_user_profile';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Valtway Console UI Exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-lg">
          <span className="material-symbols-outlined text-red-600 text-[48px]">warning</span>
          <h2 className="text-lg font-extrabold text-red-900">Console UI Exception Encountered</h2>
          <p className="text-xs text-red-700 font-mono bg-red-100 p-3 rounded-lg text-left overflow-x-auto">
            {this.state.error?.toString()}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow hover:bg-red-700 transition-all"
          >
            Reload Console View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('platform');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  const [user, setUser] = useState({
    id: 'usr-1',
    email: 'admin@valtway.ai',
    name: 'Dr. Elena Vance',
    role: 'Cold Operations Director',
    organization: 'Apex Life Sciences'
  });

  // Fetch stored user profile directly from database repository
  useEffect(() => {
    const fetchUserProfileFromDb = async () => {
      try {
        const dbProfile = await apiService.getProfile();
        if (dbProfile && dbProfile.name) {
          setUser(dbProfile);
        }
      } catch (err) {
        console.warn('DB profile fetch fallback:', err);
      }
    };
    fetchUserProfileFromDb();
  }, []);

  const [selectedShipmentId, setSelectedShipmentId] = useState(null);

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    try {
      await apiService.updateProfile({
        name: userData.name,
        role: userData.role,
        organization: userData.organization
      });
    } catch (e) {
      console.error('DB login profile sync error:', e);
    }
    setActiveTab('dashboard');
  };

  const handleUpdateUser = async (updatedUserData) => {
    setUser(updatedUserData);
    try {
      await apiService.updateProfile({
        name: updatedUserData.name,
        role: updatedUserData.role,
        organization: updatedUserData.organization
      });
    } catch (e) {
      console.error('DB user profile update error:', e);
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
            <ErrorBoundary key={activeTab}>

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
            </ErrorBoundary>
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
