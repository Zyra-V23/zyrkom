import React, { ReactNode, useState, useRef, useEffect } from 'react';

interface FloatingWindowProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  className?: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  buttonType?: 'close' | 'minimize';
}

const FloatingWindow: React.FC<FloatingWindowProps> = ({ 
  title, 
  children, 
  onClose, 
  initialX = 100, 
  initialY = 100,
  width = 600,
  height = 400,
  className = '',
  minWidth = 300,
  minHeight = 200,
  maxWidth = 800,
  maxHeight = 600,
  buttonType = 'close'
}) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width, height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Limitar la ventana dentro de la pantalla
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
        
        // Asegurar que la ventana no se salga de la pantalla
        const maxAllowedWidth = window.innerWidth - position.x;
        const maxAllowedHeight = window.innerHeight - position.y;
        
        setSize({
          width: Math.min(newWidth, maxAllowedWidth),
          height: Math.min(newHeight, maxAllowedHeight)
        });
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
  }, [isDragging, isResizing, dragOffset, resizeStart, size.width, size.height, position.x, position.y, minWidth, minHeight, maxWidth, maxHeight]);

  return (
    <div 
      ref={windowRef}
      className={`floating-window ${className}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 1000,
        border: '2px solid #b0b0c0',
        backgroundColor: '#c0c0c0',
        boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.5)',
        fontFamily: 'var(--font-pixel)',
        fontSize: '12px'
      }}
    >
      {/* Barra de título */}
      <div 
        className="window-titlebar"
        style={{
          height: '24px',
          backgroundColor: '#000080',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{title}</span>
        <button
          onClick={onClose}
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#c0c0c0',
            border: '1px solid #808080',
            color: '#000000',
            fontSize: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={buttonType === 'minimize' ? 'Minimize' : 'Close'}
        >
          {buttonType === 'minimize' ? '_' : '×'}
        </button>
      </div>
      
      {/* Contenido de la ventana */}
      <div 
        className="window-content"
        style={{
          height: 'calc(100% - 24px)',
          backgroundColor: '#c0c0c0',
          overflow: 'auto',
          padding: '8px',
          position: 'relative'
        }}
      >
        {children}
        
        {/* Control de redimensionamiento */}
        <div
          className="resize-handle"
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '0px',
            width: '16px',
            height: '16px',
            cursor: 'nw-resize',
            background: `
              linear-gradient(135deg, transparent 0%, transparent 30%, #808080 30%, #808080 35%, transparent 35%, transparent 65%, #808080 65%, #808080 70%, transparent 70%),
              linear-gradient(45deg, transparent 0%, transparent 30%, #808080 30%, #808080 35%, transparent 35%, transparent 65%, #808080 65%, #808080 70%, transparent 70%)
            `,
            backgroundSize: '4px 4px',
            backgroundPosition: '0 0, 2px 2px'
          }}
          onMouseDown={handleResizeMouseDown}
          title="Drag to resize"
        />
      </div>
    </div>
  );
};

export default FloatingWindow; 