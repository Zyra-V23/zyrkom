import React from 'react';
import { useSound } from '../contexts/SoundContext';

interface RetroButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const RetroButton: React.FC<RetroButtonProps> = ({ 
  onClick, 
  children, 
  className = '',
  disabled = false
}) => {
  const { playMenuSelect } = useSound();

  const handleClick = () => {
    if (!disabled) {
      playMenuSelect();
      onClick();
    }
  };

  return (
    <button
      className={`retro-button ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default RetroButton;