import React, { ReactNode } from 'react';

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const RetroWindow: React.FC<RetroWindowProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`retro-window ${className}`}>
      <div className="retro-window-title">{title}</div>
      <div className="retro-window-content">
        {children}
      </div>
    </div>
  );
};

export default RetroWindow;