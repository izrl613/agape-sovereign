import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ScanProvider } from './ScanContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Login } from './components/Login 2';
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
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
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

const AppRoutes = () => {
  const { user, setupComplete, setSetupComplete } = useAuth();

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

      {/* Auth route — redirect to dashboard if already signed in */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* Protected app — all authenticated routes live under /dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
        {/* V-08 through V-15 — identity-vector routes */}
        <Route path="location"   element={<LocationModule />} />
        <Route path="browser"    element={<BrowserTrackerModule />} />
        <Route path="medical"    element={<MedicalModule />} />
        <Route path="biometric"  element={<BiometricIdentityModule />} />
        <Route path="iot"        element={<IoTModule />} />
        <Route path="darkweb"    element={<DarkWebModule />} />
        <Route path="behavioral" element={<BehavioralModule />} />
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

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ScanProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" theme="dark" richColors closeButton />
            {/* Passkey onboarding: appears once after first Google login on capable devices */}
            <PasskeySetupPrompt />
          </BrowserRouter>
        </ScanProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
