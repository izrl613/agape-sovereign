import React, { createContext, useContext, useState, useEffect } from 'react';
import { createWebAuthn } from './webauthn';
import { GoogleAuthProvider } from './google-auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (authMethod: 'passkey' | 'google') => Promise<void>;
  logout: () => void;
  registerPasskey: (credentialId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const session = sessionStorage.getItem('agape_session');
    if (session) {
      setUser(JSON.parse(session));
    }
    setIsLoading(false);
  }, []);

  const login = async (authMethod: 'passkey' | 'google') => {
    setIsLoading(true);
    try {
      if (authMethod === 'passkey') {
        const webAuthn = createWebAuthn();
        const result = await webAuthn.login();
        if (result.success) {
          const user = {
            id: result.userId,
            name: result.name,
            authMethod: 'passkey',
            verified: result.verified
          };
          setUser(user);
          sessionStorage.setItem('agape_session', JSON.stringify(user));
        }
      } else {
        const googleAuth = new GoogleAuthProvider();
        await googleAuth.login();
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('agape_session');
  };

  const registerPasskey = async (credentialId: string) => {
    // Implementation for passkey registration
    console.log('Registering passkey:', credentialId);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, registerPasskey }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
