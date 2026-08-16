import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { NEON, NeonButton } from '../UI';
import { toast } from 'sonner';

interface LogoutButtonProps {
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'button',
  size = 'md',
  label = 'DISCONNECT',
  className = '',
  style = {},
  onClick,
}) => {
  const { logout, demoMode, clearDemoUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (demoMode) {
        clearDemoUser();
        toast.info('Demo session ended. Your temporary identity has been cleared.');
      } else {
        await logout();
        toast.info('Session disconnected. You have been signed out.');
      }
      onClick?.();
    } catch (error) {
      toast.error('Failed to disconnect session.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        title={isLoggingOut ? 'Disconnecting...' : 'Disconnect Session'}
        className={`logout-icon-btn ${className}`}
        style={{
          background: 'rgba(255, 46, 159, 0.12)',
          border: `1px solid ${NEON.magenta}44`,
          borderRadius: '50%',
          width: size === 'sm' ? 32 : 40,
          height: size === 'sm' ? 32 : 40,
          cursor: isLoggingOut ? 'wait' : 'pointer',
          color: NEON.magenta,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLoggingOut ? 0.5 : 1,
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        <LogOut size={size === 'sm' ? 14 : 18} />
      </button>
    );
  }

  return (
    <NeonButton
      onClick={handleLogout}
      disabled={isLoggingOut}
      color={NEON.magenta}
      size={size}
      className={`logout-btn ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        ...style,
      }}
    >
      {isLoggingOut ? (
        'DISCONNECTING...'
      ) : (
        <>
          <LogOut size={size === 'sm' ? 12 : 16} />
          {label}
        </>
      )}
    </NeonButton>
  );
};
