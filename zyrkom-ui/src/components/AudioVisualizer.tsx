import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AudioData {
  frequencies: number[];
  amplitudes: number[];
  notes?: string[];
  durations?: number[];
  audioBuffer?: number[];
  spectrum?: number[];
  timestamp: number;
  isPlaying?: boolean;
}

interface AudioVisualizerProps {
  audioData: AudioData | null;
  isPlaying: boolean;
  className?: string;
  width?: number;
  height?: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  audioData, 
  isPlaying, 
  className = '',
  width = 750,
  height = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const [visualMode, setVisualMode] = useState<'waveform' | 'spectrum' | 'bars'>('waveform');
  
  // Smooth interpolation state
  const [smoothSpectrum, setSmoothSpectrum] = useState<number[]>(new Array(128).fill(0));
  const [smoothFrequencies, setSmoothFrequencies] = useState<number[]>([]);

  // Smooth interpolation function
  const interpolate = useCallback((current: number[], target: number[], factor: number = 0.1): number[] => {
    if (current.length !== target.length) {
      return target.slice();
    }
    
    return current.map((val, i) => val + (target[i] - val) * factor);
  }, []);

  // Main drawing function with smooth animations
  const draw = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.016; // ~60fps

    // Clear with dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw grid background
    drawGrid(ctx, width, height);

    if (audioData && isPlaying) {
      // Update smooth data
      if (audioData.spectrum) {
        setSmoothSpectrum(prev => interpolate(prev, audioData.spectrum!, 0.15));
      }
      
      if (audioData.frequencies) {
        setSmoothFrequencies(prev => interpolate(prev, audioData.frequencies, 0.12));
      }

      // Draw based on selected mode
      switch (visualMode) {
        case 'waveform':
          drawWaveform(ctx, audioData, width, height);
          break;
        case 'spectrum':
          drawSpectrum(ctx, smoothSpectrum, width, height);
          break;
        case 'bars':
          drawFrequencyBars(ctx, smoothFrequencies, audioData.amplitudes || [], width, height);
          break;
      }

      // Draw notes overlay
      if (audioData.notes && audioData.notes.length > 0) {
        drawNotesOverlay(ctx, audioData.notes, audioData.frequencies, width, height);
      }
    } else {
      // Draw static visualization when not playing
      drawStaticVisualization(ctx, width, height);
    }

    // Draw HUD
    drawHUD(ctx, width, height, audioData);

    animationRef.current = requestAnimationFrame(draw);
  }, [audioData, isPlaying, visualMode, smoothSpectrum, smoothFrequencies, interpolate]);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#00ff0015';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (h / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let i = 0; i <= 20; i++) {
      const x = (w / 20) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, data: AudioData, w: number, h: number) => {
    if (!data.audioBuffer || data.audioBuffer.length === 0) return;

    const buffer = data.audioBuffer;
    const sliceWidth = w / buffer.length;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#00ff88');
    gradient.addColorStop(0.5, '#0088ff');
    gradient.addColorStop(1, '#8800ff');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let x = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i] * 0.5 + 0.5; // Normalize to 0-1
      const y = v * h;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawSpectrum = (ctx: CanvasRenderingContext2D, spectrum: number[], w: number, h: number) => {
    const barWidth = w / spectrum.length;
    
    spectrum.forEach((magnitude, index) => {
      const barHeight = (magnitude / 255) * h * 0.8;
      const x = index * barWidth;
      const y = h - barHeight;
      
      // Color based on frequency range
      const hue = (index / spectrum.length) * 240; // Blue to red spectrum
      const saturation = 80 + (magnitude / 255) * 20; // More saturated for louder
      const lightness = 40 + (magnitude / 255) * 40;
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
      
      // Add glow for prominent frequencies
      if (magnitude > 100) {
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 5;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
        ctx.shadowBlur = 0;
      }
    });
  };

  const drawFrequencyBars = (ctx: CanvasRenderingContext2D, frequencies: number[], amplitudes: number[], w: number, h: number) => {
    if (frequencies.length === 0) return;

    const barWidth = w / Math.max(frequencies.length, 8);
    
    frequencies.forEach((freq, index) => {
      const amplitude = amplitudes[index] || 0.5;
      const normalizedFreq = Math.min(freq / 2000, 1); // Normalize to 0-1
      const barHeight = amplitude * h * 0.7;
      
      const x = index * barWidth;
      const y = h - barHeight;
      
      // Color based on frequency
      const hue = normalizedFreq * 180; // Green to cyan range
      const saturation = 70 + amplitude * 30;
      const lightness = 50 + amplitude * 30;
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      
      // Add frequency label for taller bars
      if (barHeight > h * 0.3) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${freq.toFixed(0)}Hz`, x + barWidth/2, y - 5);
      }
    });
  };

  const drawNotesOverlay = (ctx: CanvasRenderingContext2D, notes: string[], frequencies: number[], w: number, h: number) => {
    ctx.fillStyle = '#ffff00cc';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    
    notes.forEach((note, index) => {
      const x = 10 + index * 60;
      const y = 30;
      
      // Background
      ctx.fillStyle = '#000000aa';
      ctx.fillRect(x - 5, y - 15, 50, 20);
      
      // Note text
      ctx.fillStyle = '#ffff00';
      ctx.fillText(note, x, y);
      
      // Frequency text
      if (frequencies[index]) {
        ctx.fillStyle = '#88ffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${frequencies[index].toFixed(0)}Hz`, x, y + 12);
        ctx.font = 'bold 14px monospace';
      }
    });
  };

  const drawStaticVisualization = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Animated static pattern
    const time = timeRef.current * 0.5;
    
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(time + i * 0.1) * 0.3 + 0.5) * w;
      const y = (Math.cos(time + i * 0.15) * 0.3 + 0.5) * h;
      const radius = Math.sin(time + i * 0.2) * 3 + 4;
      
      const hue = (time * 10 + i * 5) % 360;
      ctx.fillStyle = `hsl(${hue}, 60%, 40%)`;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center text
    ctx.fillStyle = '#00ff88';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 Zyrkom Audio Visualizer Ready', w / 2, h / 2);
    
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('Waiting for Spanish Anthem audio stream...', w / 2, h / 2 + 25);
  };

  const drawHUD = (ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioData | null) => {
    // Mode selector background
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(w - 150, 5, 145, 60);
    
    // Mode buttons
    const modes: Array<{mode: typeof visualMode, label: string, icon: string}> = [
      { mode: 'waveform', label: 'Wave', icon: '〰️' },
      { mode: 'spectrum', label: 'Spec', icon: '📊' },
      { mode: 'bars', label: 'Bars', icon: '📈' }
    ];
    
    modes.forEach((m, index) => {
      const x = w - 140 + index * 45;
      const y = 15;
      const isActive = visualMode === m.mode;
      
      ctx.fillStyle = isActive ? '#00ff88' : '#666666';
      ctx.fillRect(x, y, 40, 20);
      
      ctx.fillStyle = isActive ? '#000000' : '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.icon, x + 20, y + 8);
      ctx.fillText(m.label, x + 20, y + 18);
    });

    // Status info
    if (data) {
      ctx.fillStyle = '#00ff88';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Freq: ${data.frequencies?.length || 0}`, 10, h - 30);
      ctx.fillText(`Time: ${new Date(data.timestamp).toLocaleTimeString()}`, 10, h - 20);
      ctx.fillText(`Playing: ${isPlaying ? '🎵' : '⏸️'}`, 10, h - 10);
    }
  };

  // Handle click events for mode switching
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check mode buttons
    if (x >= width - 150 && x <= width - 5 && y >= 5 && y <= 35) {
      const buttonIndex = Math.floor((x - (width - 140)) / 45);
      const modes: Array<typeof visualMode> = ['waveform', 'spectrum', 'bars'];
      if (buttonIndex >= 0 && buttonIndex < modes.length) {
        setVisualMode(modes[buttonIndex]);
      }
    }
  };

  // Initialize animation
  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <div className={`audio-visualizer ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="cursor-pointer border border-gray-600"
        style={{ 
          background: 'linear-gradient(45deg, #000000, #001122)',
          borderRadius: '4px'
        }}
      />
      <div className="text-xs mt-1 text-gray-400 font-mono">
        🎛️ Click visualization modes: Waveform | Spectrum | Frequency Bars
      </div>
    </div>
  );
};

export default AudioVisualizer;