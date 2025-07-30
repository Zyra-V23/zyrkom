import React, { useState, useRef, useEffect } from 'react';

interface FloatingWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
}

const FloatingWindow: React.FC<FloatingWindowProps> = ({
  title,
  onClose,
  children,
  initialX = 100,
  initialY = 100,
  width = 600,
  height = 400,
  minWidth = 300,
  minHeight = 200,
  resizable = true,
}) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width, height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing && windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        const newWidth = Math.max(minWidth, e.clientX - rect.left);
        const newHeight = Math.max(minHeight, e.clientY - rect.top);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, minWidth, minHeight]);

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  return (
    <div
      ref={windowRef}
      className="window-95 absolute"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 1000,
      }}
    >
      {/* Title Bar */}
      <div
        className="window-titlebar"
        onMouseDown={handleTitleBarMouseDown}
        style={{ cursor: isDragging ? 'move' : 'default' }}
      >
        <span>{title}</span>
        <div className="flex">
          <button className="window-button" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="bg-white" style={{ height: 'calc(100% - 22px)' }}>
        {children}
      </div>

      {/* Resize Handle */}
      {resizable && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
          style={{
            borderRight: '2px solid #000000',
            borderBottom: '2px solid #000000',
          }}
        />
      )}
    </div>
  );
};

export default FloatingWindow;