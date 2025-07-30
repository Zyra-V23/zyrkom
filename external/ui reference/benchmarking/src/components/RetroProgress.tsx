import React, { useEffect, useState } from 'react';

interface RetroProgressProps {
  value: number;
  max: number;
  label?: string;
}

const RetroProgress: React.FC<RetroProgressProps> = ({ 
  value, 
  max, 
  label 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    // Animate the progress value
    const increment = max / 20;
    const interval = setInterval(() => {
      setDisplayValue(prev => {
        if (prev < value) {
          return Math.min(prev + increment, value);
        } else {
          clearInterval(interval);
          return value;
        }
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [value, max]);

  const percentage = (displayValue / max) * 100;
  
  return (
    <div className="progress-bar">
      <div 
        className="progress-bar-fill" 
        style={{ width: `${percentage}%` }}
      />
      <div className="progress-bar-text">
        {label || `${Math.round(percentage)}%`}
      </div>
    </div>
  );
};

export default RetroProgress;