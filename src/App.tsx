import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ScanProvider } from './ScanContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ArchitectAI } from './components/ArchitectAI';
import { AdminPortal } from './components/AdminPortal';
import { UserProfileSettings } from './components/UserProfileSettings';
import { SecurityTips } from './components/SecurityTips';
import { 
  EmailModule, 
  SocialModule, 
  DeviceModule, 
  SystemModule, 
  LaptopModule,
  DeepWebModule, 
  DataBrokerModule,
  PasswordModule,
  NetworkModule,
  CloudModule,
  CommunicationModule,
  FinancialModule,
  DocumentModule,
  OauthModule,
  LegalModule,
  BiometricModule,
  ErasureModule
} from './components/DiffModules';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060D1F] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#00D4FF]/20 border-t-[#00D4FF] rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060D1F] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#00D4FF]/20 border-t-[#00D4FF] rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

import { SplashEntry } from './components/SplashEntry';

const AppRoutes = () => {
  const { user, setupComplete, setSetupComplete } = useAuth();

  if (user && !setupComplete) {
    return <SplashEntry onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="email" element={<EmailModule />} />
        <Route path="social" element={<SocialModule />} />
        <Route path="device" element={<DeviceModule />} />
        <Route path="system" element={<SystemModule />} />
        <Route path="laptop" element={<LaptopModule />} />
        <Route path="deepweb" element={<DeepWebModule />} />
        <Route path="databroker" element={<DataBrokerModule />} />
        <Route path="password" element={<PasswordModule />} />
        <Route path="network" element={<NetworkModule />} />
        <Route path="cloud" element={<CloudModule />} />
        <Route path="communication" element={<CommunicationModule />} />
        <Route path="financial" element={<FinancialModule />} />
        <Route path="documents" element={<DocumentModule />} />
        <Route path="oauth" element={<OauthModule />} />
        <Route path="legal" element={<LegalModule />} />
        <Route path="ai" element={<BiometricModule />} />
        <Route path="erasure" element={<ErasureModule />} />
        <Route path="architect" element={<ArchitectAI />} />
        <Route path="security-tips" element={<SecurityTips />} />
        <Route path="settings" element={<UserProfileSettings />} />
        <Route path="admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />
      </Route>
    </Routes>
  );
};

import { Toaster } from 'sonner';
import ArchitectUIApp from './ArchitectUI';
import { UIDesignProvider, useUIDesign } from './UIDesignContext';
import { ThemeProvider } from './context/ThemeContext'; // Assuming ThemeProvider is here or change it if missing

const UniversalApp = () => {
  const { currentDesign } = useUIDesign();
  return currentDesign === 'architect' ? <ArchitectUIApp /> : <AppRoutes />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <UIDesignProvider>
        <ThemeProvider>
          <AuthProvider>
            <ScanProvider>
              <BrowserRouter>
                <UniversalApp />
                <Toaster position="top-right" theme="dark" richColors closeButton />
              </BrowserRouter>
            </ScanProvider>
          </AuthProvider>
        </ThemeProvider>
      </UIDesignProvider>
    </ErrorBoundary>
  );
}
