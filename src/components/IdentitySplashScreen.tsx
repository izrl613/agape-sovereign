import React, { useEffect, useState } from 'react';
import { computeIdentityHash } from '../utils/cryptoUtils';

interface UserState {
  name: string;
  role: string;
  lastActivity: string;
}

interface IdentitySplashScreenProps {
  moduleName: string;
  onComplete: () => void;
}

/**
 * Adaptive Splash Screen for the Identity Modules.
 * Fetches user state, adapts the message, and displays the SHA256 ID.
 */
export const IdentitySplashScreen: React.FC<IdentitySplashScreenProps> = ({ 
  moduleName, 
  onComplete 
}) => {
  const [userState, setUserState] = useState<UserState | null>(null);
  const [sha256Id, setSha256Id] = useState<string>('Generating...');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulated fetch of user data (would be via auth token and firestore in reality)
    const fetchUserData = async () => {
      try {
        // Simulating API latency
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        const mockUserData: UserState = {
          name: 'Authorized User',
          role: 'Administrator',
          lastActivity: new Date().toISOString(),
        };
        setUserState(mockUserData);

        // Compute the deterministic hash based on project context
        const hash = await computeIdentityHash({
          projectId: 'agape-sovereign',
          versionNumber: '1.0.0',
          buildManifest: mockUserData.lastActivity, // Or a proper build manifest
        });
        setSha256Id(hash);
        setLoading(false);

        // Auto-complete splash screen after presentation
        setTimeout(() => {
          onComplete();
        }, 3000);

      } catch (error) {
        console.error('Failed to initialize splash screen', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white relative overflow-hidden">
      {/* Dynamic Background Element */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-black pointer-events-none" />

      {/* Main Adaptive Content */}
      <div className="z-10 flex flex-col items-center space-y-6 text-center animate-fade-in-up">
        <h1 className="text-4xl font-light tracking-widest text-indigo-400">
          {moduleName.toUpperCase()}
        </h1>
        
        <div className="h-24 flex items-center justify-center">
          {loading ? (
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin mb-4" />
              <p className="text-gray-400 tracking-widest text-sm">AUTHENTICATING...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 animate-fade-in">
              <p className="text-xl font-medium text-gray-200">
                Welcome back, {userState?.name}
              </p>
              <p className="text-sm text-gray-500 font-mono">
                Clearance: {userState?.role}
              </p>
              <p className="text-xs text-indigo-500/70 mt-4 tracking-widest">
                INITIALIZING MODULE ENVIRONMENTS
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cryptographic Footer */}
      <div className="absolute bottom-6 w-full text-center text-xs text-gray-600 font-mono tracking-widest opacity-80">
        <p>AGAPE SOVEREIGN SECURE PROTOCOL</p>
        <p className="mt-1 max-w-lg mx-auto truncate" title={sha256Id}>
          SHA256: {sha256Id}
        </p>
      </div>
    </div>
  );
};
