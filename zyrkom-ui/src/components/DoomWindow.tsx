import React from 'react';
import FloatingWindow from './FloatingWindow';

interface DoomWindowProps {
  onClose: () => void;
}

const DoomWindow: React.FC<DoomWindowProps> = ({ onClose }) => {
  return (
    <FloatingWindow
      title="DOOM - RIP AND TEAR"
      onClose={onClose}
      width={640}
      height={480}
    >
      <div className="h-full bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-red-500 text-4xl font-bold mb-4" style={{ fontFamily: 'Press Start 2P' }}>
            DOOM
          </h1>
          <p className="text-green-400 text-sm" style={{ fontFamily: 'Press Start 2P' }}>
            READY TO RIP AND TEAR
          </p>
          <p className="text-gray-500 text-xs mt-8">
            (Placeholder - DOOM game would go here)
          </p>
        </div>
      </div>
    </FloatingWindow>
  );
};

export default DoomWindow;