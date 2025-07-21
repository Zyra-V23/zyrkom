import React, { useEffect, useRef } from 'react';

const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters - simplified
    const chars = '01';
    const charArray = chars.split('');

    // Reduced number of columns for better performance
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Initialize drops array - much smaller
    const drops: number[] = [];
    for (let i = 0; i < Math.min(columns, 50); i++) { // Max 50 columns
      drops[i] = Math.random() * -canvas.height;
    }

    let lastTime = 0;
    const targetFPS = 10; // Much lower FPS for better performance
    const frameInterval = 1000 / targetFPS;

    const draw = (currentTime: number) => {
      // Throttle animation
      if (currentTime - lastTime < frameInterval) {
        requestAnimationFrame(draw);
        return;
      }
      lastTime = currentTime;

      // Semi-transparent black background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Matrix green text
      ctx.fillStyle = '#00ff00';
      ctx.font = `${fontSize}px monospace`;

      // Draw only every 4th column to improve performance
      for (let i = 0; i < drops.length; i += 4) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle = `rgba(0, 255, 0, ${Math.random() * 0.5 + 0.3})`;
        ctx.fillText(text, x, y);

        // Reset drop when it goes off screen
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }

        // Move drop down slowly
        drops[i] += 0.3;
      }

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="matrix-rain-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.3, // Reducir opacidad para mejor rendimiento visual
      }}
    />
  );
};

export default MatrixRain; 