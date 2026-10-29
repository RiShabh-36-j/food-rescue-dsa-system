import React, { useState } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { DonationsPage } from './pages/DonationsPage';
import { RecipientsPage } from './pages/RecipientsPage';
import { SmartMatchingPage } from './pages/SmartMatchingPage';
import { RoutePlannerPage } from './pages/RoutePlannerPage';
import { AllocationHistoryPage } from './pages/AllocationHistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlgorithmVisualizerPage } from './pages/AlgorithmVisualizerPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('overview');

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage onNavigate={setCurrentPage} />;
      case 'donations':
        return <DonationsPage />;
      case 'recipients':
        return <RecipientsPage />;
      case 'matching':
        return <SmartMatchingPage onNavigate={setCurrentPage} />;
      case 'routes':
        return <RoutePlannerPage />;
      case 'history':
        return <AllocationHistoryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'visualizer':
        return <AlgorithmVisualizerPage />;
      case 'settings':
        return <SettingsPage onDataReset={() => setCurrentPage('overview')} />;
      default:
        return <OverviewPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
