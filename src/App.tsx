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
import { ShieldModule } from './components/ShieldModule';
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
  BiometricIdentityModule,
  ErasureModule,
  // V-08 through V-15 — previously missing routes
  LocationModule,
  BrowserTrackerModule,
  MedicalModule,
  IoTModule,
  DarkWebModule,
  BehavioralModule,
} from './components/DiffModules';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, demoMode } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#00D4FF]/20 border-t-[#00D4FF] rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user && !demoMode) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#00D4FF]/20 border-t-[#00D4FF] rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

import { SplashEntry } from './components/SplashEntry';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { ContactPage } from './components/ContactPage';
import { OfflinePage } from './components/OfflinePage';

const AppRoutes = () => {
  const { user, setupComplete, setSetupComplete, demoMode } = useAuth();

  if (user && !setupComplete) {
    return <SplashEntry onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/offline" element={<OfflinePage />} />

      {/* Auth route — redirect to dashboard if already signed in */}
      <Route path="/login" element={(user || demoMode) ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* Top-level aliases redirecting to /dashboard/* */}
      <Route path="/email" element={<Navigate to="/dashboard/email" replace />} />
      <Route path="/social" element={<Navigate to="/dashboard/social" replace />} />
      <Route path="/device" element={<Navigate to="/dashboard/device" replace />} />
      <Route path="/mobile" element={<Navigate to="/dashboard/mobile" replace />} />
      <Route path="/system" element={<Navigate to="/dashboard/mobile" replace />} />
      <Route path="/laptop" element={<Navigate to="/dashboard/laptop" replace />} />
      <Route path="/deepweb" element={<Navigate to="/dashboard/deepweb" replace />} />
      <Route path="/broker" element={<Navigate to="/dashboard/broker" replace />} />
      <Route path="/databroker" element={<Navigate to="/dashboard/broker" replace />} />
      <Route path="/password" element={<Navigate to="/dashboard/password" replace />} />
      <Route path="/location" element={<Navigate to="/dashboard/location" replace />} />
      <Route path="/browser" element={<Navigate to="/dashboard/browser" replace />} />
      <Route path="/financial" element={<Navigate to="/dashboard/financial" replace />} />
      <Route path="/medical" element={<Navigate to="/dashboard/medical" replace />} />
      <Route path="/biometric" element={<Navigate to="/dashboard/biometric" replace />} />
      <Route path="/iot" element={<Navigate to="/dashboard/iot" replace />} />
      <Route path="/cloud" element={<Navigate to="/dashboard/cloud" replace />} />
      <Route path="/darkweb" element={<Navigate to="/dashboard/darkweb" replace />} />
      <Route path="/behavioral" element={<Navigate to="/dashboard/behavioral" replace />} />
      <Route path="/architect" element={<Navigate to="/dashboard/architect" replace />} />
      <Route path="/security-tips" element={<Navigate to="/dashboard/security-tips" replace />} />
      <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
      <Route path="/shield" element={<Navigate to="/dashboard/shield" replace />} />
      <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />

      {/* Protected app — all authenticated routes live under /dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        {/* Canonical 16 Identity Vectors */}
        <Route path="email" element={<EmailModule />} />
        <Route path="social" element={<SocialModule />} />
        <Route path="device" element={<DeviceModule />} />
        <Route path="mobile" element={<SystemModule />} />
        <Route path="system" element={<SystemModule />} />
        <Route path="laptop" element={<LaptopModule />} />
        <Route path="deepweb" element={<DeepWebModule />} />
        <Route path="broker" element={<DataBrokerModule />} />
        <Route path="databroker" element={<DataBrokerModule />} />
        <Route path="password" element={<PasswordModule />} />
        <Route path="location" element={<LocationModule />} />
        <Route path="browser" element={<BrowserTrackerModule />} />
        <Route path="financial" element={<FinancialModule />} />
        <Route path="medical" element={<MedicalModule />} />
        <Route path="biometric" element={<BiometricIdentityModule />} />
        <Route path="iot" element={<IoTModule />} />
        <Route path="cloud" element={<CloudModule />} />
        <Route path="darkweb" element={<DarkWebModule />} />
        <Route path="behavioral" element={<BehavioralModule />} />
        {/* Supporting specialized modules */}
        <Route path="network" element={<NetworkModule />} />
        <Route path="communication" element={<CommunicationModule />} />
        <Route path="documents" element={<DocumentModule />} />
        <Route path="oauth" element={<OauthModule />} />
        <Route path="legal" element={<LegalModule />} />
        <Route path="ai" element={<BiometricModule />} />
        <Route path="erasure" element={<ErasureModule />} />
        <Route path="shield" element={<ShieldModule />} />
        <Route path="architect" element={<ArchitectAI />} />
        <Route path="security-tips" element={<SecurityTips />} />
        <Route path="settings" element={<UserProfileSettings />} />
        <Route path="admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />
      </Route>
    </Routes>
  );
};

import { Toaster } from 'sonner';
import { PasskeySetupPrompt } from './components/auth/PasskeySetupPrompt';
import { DemoBanner } from './components/auth/DemoBanner';
import { UIDesignProvider, useUIDesign } from './UIDesignContext';
import ArchitectUI from './ArchitectUI';

const MainAppContent = () => {
  const { currentDesign } = useUIDesign();

  if (currentDesign === 'architect') {
    return (
      <>
        <ArchitectUI />
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </>
    );
  }

  return (
    <BrowserRouter>
      <DemoBanner />
      <AppRoutes />
      <Toaster position="top-right" theme="dark" richColors closeButton />
      {/* Passkey onboarding: appears once after first Google login on capable devices */}
      <PasskeySetupPrompt />
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ScanProvider>
          <UIDesignProvider>
            <MainAppContent />
          </UIDesignProvider>
        </ScanProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
