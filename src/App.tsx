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
  DeepWebModule, 
  DataBrokerModule,
  PasswordModule,
  LocationModule,
  BrowserModule,
  FinancialModule,
  MedicalModule,
  BiometricModule,
  IotModule,
  CloudModule,
  DarkWebModule,
  BehavioralModule
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
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="email" element={<EmailModule />} />
        <Route path="social" element={<SocialModule />} />
        <Route path="device" element={<DeviceModule />} />
        <Route path="system" element={<SystemModule />} />
        <Route path="deepweb" element={<DeepWebModule />} />
        <Route path="databroker" element={<DataBrokerModule />} />
        <Route path="password" element={<PasswordModule />} />
        <Route path="location" element={<LocationModule />} />
        <Route path="browser" element={<BrowserModule />} />
        <Route path="financial" element={<FinancialModule />} />
        <Route path="medical" element={<MedicalModule />} />
        <Route path="biometric" element={<BiometricModule />} />
        <Route path="iot" element={<IotModule />} />
        <Route path="cloud" element={<CloudModule />} />
        <Route path="darkweb" element={<DarkWebModule />} />
        <Route path="behavioral" element={<BehavioralModule />} />
        <Route path="architect" element={<ArchitectAI />} />
        <Route path="security-tips" element={<SecurityTips />} />
        <Route path="settings" element={<UserProfileSettings />} />
        <Route path="admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />
      </Route>
    </Routes>
  );
};

import { Toaster } from 'sonner';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ScanProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" theme="dark" richColors closeButton />
          </BrowserRouter>
        </ScanProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

