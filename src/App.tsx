import React from 'react';
import { GlobalStyles } from './theme/GlobalStyles';
import { SovereignProvider } from './context/SovereignContext';
import { Dashboard } from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <SovereignProvider>
      <GlobalStyles />
      <Dashboard />
    </SovereignProvider>
  );
};

export default App;
