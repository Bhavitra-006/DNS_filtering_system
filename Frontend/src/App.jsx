import React, { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import DnsQueriesPage from './pages/DnsQueriesPage';
import BlockedDomainsPage from './pages/BlockedDomainsPage';
import DomainCheckerPage from './pages/DomainCheckerPage';
import ThreatIntelligencePage from './pages/ThreatIntelligencePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SystemStatusPage from './pages/SystemStatusPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Global keyboard shortcuts (Alt+1 to Alt+8 for rapid SOC navigation)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        const pages = [
          'dashboard',
          'queries',
          'blocked',
          'checker',
          'threat-intel',
          'analytics',
          'system-status',
          'settings',
        ];
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 8) {
          e.preventDefault();
          setActivePage(pages[num - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGlobalRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage key={refreshKey} onNavigate={setActivePage} />;
      case 'queries':
        return <DnsQueriesPage key={refreshKey} />;
      case 'blocked':
        return <BlockedDomainsPage key={refreshKey} />;
      case 'checker':
        return <DomainCheckerPage key={refreshKey} />;
      case 'threat-intel':
        return <ThreatIntelligencePage key={refreshKey} />;
      case 'analytics':
        return <AnalyticsPage key={refreshKey} />;
      case 'system-status':
        return <SystemStatusPage key={refreshKey} />;
      case 'settings':
        return <SettingsPage key={refreshKey} />;
      default:
        return <DashboardPage key={refreshKey} onNavigate={setActivePage} />;
    }
  };

  return (
    <MainLayout
      activePage={activePage}
      setActivePage={setActivePage}
      onRefresh={handleGlobalRefresh}
    >
      {renderActivePage()}
    </MainLayout>
  );
}
