import React from 'react';

interface ArchitectLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  actionRow: React.ReactNode;
  footer: React.ReactNode;
}

export const ArchitectLayout: React.FC<ArchitectLayoutProps> = ({ children, sidebar, actionRow, footer }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      gap: '20px',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        flex: 1,
        gap: '24px',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Main Dashboard Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative'
        }}>
          {children}
        </div>

        {/* Right Sidebar */}
        <div style={{
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto'
        }}>
          {sidebar}
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flexShrink: 0,
        paddingBottom: '10px'
      }}>
        {actionRow}
        {footer}
      </div>
    </div>
  );
};
