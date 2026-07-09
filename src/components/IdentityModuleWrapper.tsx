import React, { useEffect, useState } from 'react';
import { computeIdentityHash } from '../utils/cryptoUtils';

interface IdentityModuleWrapperProps {
  moduleName: string;
  children: React.ReactNode;
  userManifestData: string; // Dynamic user data for hash generation if needed, or build manifest
}

/**
 * A reusable wrapper for the 16 Identity Modules.
 * Ensures consistent rendering of the SHA256 ID in the footer.
 */
export const IdentityModuleWrapper: React.FC<IdentityModuleWrapperProps> = ({ 
  moduleName, 
  children, 
  userManifestData 
}) => {
  const [sha256Id, setSha256Id] = useState<string>('Generating...');

  useEffect(() => {
    const generateHash = async () => {
      try {
        const hash = await computeIdentityHash({
          projectId: 'agape-sovereign',
          versionNumber: '1.0.0', // This could be dynamically injected from package.json
          buildManifest: userManifestData || 'default-manifest', 
        });
        setSha256Id(hash);
      } catch (error) {
        console.error('Failed to generate SHA256 ID', error);
        setSha256Id('Error generating ID');
      }
    };

    generateHash();
  }, [userManifestData]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Module Header */}
      <header className="p-6 border-b border-gray-800 bg-gray-950">
        <h1 className="text-2xl font-semibold tracking-wide">Identity Module: {moduleName}</h1>
      </header>

      {/* Module Content */}
      <main className="flex-grow p-6">
        {children}
      </main>

      {/* Cryptographic Footer */}
      <footer className="p-4 border-t border-gray-800 bg-gray-950 text-center text-xs text-gray-500 font-mono">
        <div className="flex justify-center items-center gap-2">
          <span className="text-gray-400">AGAPE SOVEREIGN</span>
          <span>|</span>
          <span className="truncate max-w-md" title={sha256Id}>
            SHA256: {sha256Id}
          </span>
        </div>
      </footer>
    </div>
  );
};
