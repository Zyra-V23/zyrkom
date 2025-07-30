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
  
  // Enhanced smooth interpolation state with temporal buffering
  const [smoothSpectrum, setSmoothSpectrum] = useState<number[]>(new Array(128).fill(0));
  const [smoothFrequencies, setSmoothFrequencies] = useState<number[]>([]);
  const [smoothWaveform, setSmoothWaveform] = useState<number[]>(new Array(200).fill(0));
  const [wavePhase, setWavePhase] = useState<number>(0);
  
  // Performance optimization refs
  const lastFrameTime = useRef<number>(0);
  const frameBuffer = useRef<number[][]>([]);
  const targetFPS = 60;

  // Ultra-smooth interpolation with easing
  const interpolate = useCallback((current: number[], target: number[], factor: number = 0.08): number[] => {
    if (current.length !== target.length) {
      return target.slice();
    }
    
    return current.map((val, i) => {
      const diff = target[i] - val;
      // Exponential easing for smoother transitions
      const eased = diff * factor * (2 - Math.abs(diff / Math.max(target[i], val, 1)));
      return val + eased;
    });
  }, []);

  // Generate smooth synthetic waveform
  const generateSmoothWaveform = useCallback((frequencies: number[], amplitudes: number[], phase: number): number[] => {
    const points = 200; // Reduced for better performance
    const waveform = new Array(points).fill(0);
    
    if (!frequencies || frequencies.length === 0) {
      // Generate smooth idle animation
      for (let i = 0; i < points; i++) {
        const x = (i / points) * Math.PI * 4;
        waveform[i] = Math.sin(x + phase * 0.5) * 0.1 + 
                     Math.sin(x * 2.3 + phase * 0.7) * 0.05 +
                     Math.sin(x * 0.7 + phase * 0.3) * 0.03;
      }
      return waveform;
    }
    
    // Generate realistic waveform from frequencies
    for (let i = 0; i < points; i++) {
      const t = i / points;
      let sample = 0;
      
      frequencies.forEach((freq, idx) => {
        const amplitude = amplitudes?.[idx] || 0.3;
        const normalizedFreq = (freq / 1000) * 8; // Scale frequency for visualization
        const phaseOffset = (idx * Math.PI * 0.3); // Phase offset per frequency
        sample += amplitude * Math.sin(2 * Math.PI * normalizedFreq * t + phase + phaseOffset);
      });
      
      waveform[i] = sample / Math.max(frequencies.length, 1);
    }
    
    return waveform;
  }, []);

  // Optimized main drawing function with smooth 60fps control
  const draw = useCallback(() => {
    if (!canvasRef.current) return;

    const now = performance.now();
    const deltaTime = now - lastFrameTime.current;
    
    // Maintain consistent 60fps
    if (deltaTime < 1000 / targetFPS) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }

    lastFrameTime.current = now;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Smooth time progression
    timeRef.current += deltaTime * 0.002; // Slower, smoother progression
    setWavePhase(prev => prev + deltaTime * 0.003); // Continuous phase for smooth waves

    // Clear with dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw grid background
    drawGrid(ctx, width, height);

    if (audioData && isPlaying) {
      // Ultra-smooth data updates with temporal smoothing
      if (audioData.spectrum) {
        setSmoothSpectrum(prev => interpolate(prev, audioData.spectrum!, 0.08));
      }
      
      if (audioData.frequencies) {
        setSmoothFrequencies(prev => interpolate(prev, audioData.frequencies, 0.06));
        
        // Generate smooth waveform from frequencies
        const targetWaveform = generateSmoothWaveform(audioData.frequencies, audioData.amplitudes || [], wavePhase);
        setSmoothWaveform(prev => interpolate(prev, targetWaveform, 0.12));
      }

      // Draw based on selected mode with enhanced smoothness
      switch (visualMode) {
        case 'waveform':
          drawSmoothWaveform(ctx, smoothWaveform, width, height);
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
      // Draw smooth static visualization when not playing
      const idleWaveform = generateSmoothWaveform([], [], wavePhase);
      setSmoothWaveform(prev => interpolate(prev, idleWaveform, 0.1));
      drawSmoothWaveform(ctx, smoothWaveform, width, height);
    }

    // Draw HUD
    drawHUD(ctx, width, height, audioData);

    animationRef.current = requestAnimationFrame(draw);
  }, [audioData, isPlaying, visualMode, smoothSpectrum, smoothFrequencies, smoothWaveform, wavePhase, interpolate, generateSmoothWaveform]);

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

  const drawSmoothWaveform = (ctx: CanvasRenderingContext2D, waveform: number[], w: number, h: number) => {
    if (!waveform || waveform.length === 0) return;

    const centerY = h / 2;
    const amplitude = h * 0.35; // Use less height for smoother look
    
    // Create animated gradient
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    const hueShift = (timeRef.current * 30) % 360;
    gradient.addColorStop(0, `hsl(${(hueShift + 120) % 360}, 80%, 60%)`);
    gradient.addColorStop(0.3, `hsl(${(hueShift + 180) % 360}, 90%, 65%)`);
    gradient.addColorStop(0.7, `hsl(${(hueShift + 240) % 360}, 85%, 70%)`);
    gradient.addColorStop(1, `hsl(${(hueShift + 300) % 360}, 80%, 60%)`);
    
    // Draw main waveform with cubic bezier curves for ultra-smoothness
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const points = waveform.length;
    const step = w / (points - 1);
    
    // Start point
    const startY = centerY + waveform[0] * amplitude;
    ctx.moveTo(0, startY);
    
    // Draw smooth curves using quadratic bezier
    for (let i = 1; i < points - 1; i++) {
      const x1 = (i - 1) * step;
      const y1 = centerY + waveform[i - 1] * amplitude;
      const x2 = i * step;
      const y2 = centerY + waveform[i] * amplitude;
      const x3 = (i + 1) * step;
      const y3 = centerY + waveform[i + 1] * amplitude;
      
      // Control point for smooth curve
      const cpX = x2;
      const cpY = y2;
      
      // End point (interpolated for smoothness)
      const endX = (x2 + x3) / 2;
      const endY = (y2 + y3) / 2;
      
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    }
    
    // Final point
    const lastY = centerY + waveform[points - 1] * amplitude;
    ctx.lineTo(w, lastY);

    // Draw main line
    ctx.stroke();

    // Add multiple glow layers for smooth effect
    ctx.shadowColor = gradient;
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    
    ctx.shadowBlur = 25;
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    
    ctx.shadowBlur = 35;
    ctx.globalAlpha = 0.2;
    ctx.stroke();
    
    // Reset
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    
    // Draw subtle reflection
    ctx.globalAlpha = 0.15;
    ctx.scale(1, -0.3);
    ctx.translate(0, -h * 1.5);
    ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.globalAlpha = 1;
  };

  const drawSpectrum = (ctx: CanvasRenderingContext2D, spectrum: number[], w: number, h: number) => {
    if (!spectrum || spectrum.length === 0) return;
    
    const barWidth = w / spectrum.length;
    const maxHeight = h * 0.9; // Use 90% of available height
    const baseY = h - 20; // Leave space at bottom
    
    // Animated time-based effects
    const time = timeRef.current;
    const hueShift = (time * 20) % 360;
    
    spectrum.forEach((magnitude, index) => {
      const normalizedMag = Math.max(0, Math.min(1, magnitude / 255));
      const barHeight = normalizedMag * maxHeight;
      const x = index * barWidth;
      const y = baseY - barHeight;
      
      // Enhanced color mapping with animation
      const frequencyRatio = index / spectrum.length;
      const baseHue = (frequencyRatio * 300 + hueShift) % 360; // Extended range + animation
      const saturation = 70 + normalizedMag * 30; // Dynamic saturation
      const lightness = 45 + normalizedMag * 35; // Dynamic brightness
      
      // Create vertical gradient for each bar
      const gradient = ctx.createLinearGradient(x, y, x, baseY);
      gradient.addColorStop(0, `hsl(${baseHue}, ${saturation + 20}%, ${lightness + 20}%)`);
      gradient.addColorStop(0.6, `hsl(${baseHue}, ${saturation}%, ${lightness}%)`);
      gradient.addColorStop(1, `hsl(${baseHue}, ${saturation - 10}%, ${lightness - 15}%)`);
      
      // Draw main bar with rounded top
      ctx.fillStyle = gradient;
      const barW = barWidth - 2;
      
      // Rounded rectangle for smoother look (with fallback)
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x + 1, y, barW, barHeight, [3, 3, 0, 0]); // Rounded top
      } else {
        // Fallback for browsers without roundRect support
        ctx.rect(x + 1, y, barW, barHeight);
      }
      ctx.fill();
      
      // Add glow effect for prominent frequencies
      if (normalizedMag > 0.3) {
        ctx.shadowColor = `hsl(${baseHue}, 100%, 70%)`;
        ctx.shadowBlur = 8 + normalizedMag * 12; // Dynamic blur
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      
      // Add peak indicators for very high frequencies
      if (normalizedMag > 0.8) {
        const peakY = y - 5;
        ctx.fillStyle = `hsl(${baseHue}, 100%, 90%)`;
        ctx.fillRect(x + barW/3, peakY, barW/3, 3);
        
        // Peak glow
        ctx.shadowColor = `hsl(${baseHue}, 100%, 80%)`;
        ctx.shadowBlur = 10;
        ctx.fillRect(x + barW/3, peakY, barW/3, 3);
        ctx.shadowBlur = 0;
      }
    });
    
    // Draw frequency labels for key points
    const labelPoints = [0, Math.floor(spectrum.length * 0.25), Math.floor(spectrum.length * 0.5), Math.floor(spectrum.length * 0.75), spectrum.length - 1];
    ctx.fillStyle = '#ffffff88';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    
    labelPoints.forEach(index => {
      if (index < spectrum.length) {
        const freq = (index / spectrum.length) * 22050; // Nyquist frequency
        const x = index * barWidth + barWidth/2;
        ctx.fillText(`${freq.toFixed(0)}Hz`, x, h - 5);
      }
    });
  };

  const drawFrequencyBars = (ctx: CanvasRenderingContext2D, frequencies: number[], amplitudes: number[], w: number, h: number) => {
    if (!frequencies || frequencies.length === 0) return;

    // Calculate optimal bar spacing to use full width
    const totalBars = Math.max(frequencies.length, 1);
    const barWidth = (w - 40) / totalBars; // Leave margins
    const maxBarHeight = h * 0.85; // Use 85% of height
    const baseY = h - 30; // Leave space for labels
    
    // Time-based animations
    const time = timeRef.current;
    const animationPhase = time * 2;
    
    frequencies.forEach((freq, index) => {
      const amplitude = amplitudes[index] || 0;
      const normalizedFreq = Math.min(freq / 2000, 1); // Real frequency normalization
      const normalizedAmp = Math.max(0, Math.min(1, amplitude));
      
      // Enhanced bar height calculation with smooth scaling
      const barHeight = normalizedAmp * maxBarHeight;
      const x = 20 + index * barWidth; // Start with margin
      const y = baseY - barHeight;
      
      // Dynamic color based on real frequency and amplitude
      const baseHue = normalizedFreq * 240 + (time * 10) % 60; // Blue to red + animation
      const saturation = 75 + normalizedAmp * 25; // Amplitude affects saturation
      const lightness = 50 + normalizedAmp * 30; // Amplitude affects brightness
      
      // Create sophisticated gradient for each bar
      const gradient = ctx.createLinearGradient(x, y, x, baseY);
      gradient.addColorStop(0, `hsl(${baseHue + 20}, 100%, ${lightness + 25}%)`); // Bright top
      gradient.addColorStop(0.3, `hsl(${baseHue}, ${saturation}%, ${lightness}%)`); // Main color
      gradient.addColorStop(0.7, `hsl(${baseHue}, ${saturation - 10}%, ${lightness - 10}%)`); // Darker middle
      gradient.addColorStop(1, `hsl(${baseHue - 15}, ${saturation - 20}%, ${lightness - 20}%)`); // Dark bottom
      
      ctx.fillStyle = gradient;
      
      // Draw main bar with smooth rounded edges
      const barW = Math.max(4, barWidth - 6); // Minimum width
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x + 3, y, barW, barHeight, [4, 4, 2, 2]); // Rounded corners
      } else {
        // Fallback for browsers without roundRect support
        ctx.rect(x + 3, y, barW, barHeight);
      }
      ctx.fill();
      
      // Add pulsating glow effect based on amplitude
      if (normalizedAmp > 0.2) {
        const glowIntensity = normalizedAmp + Math.sin(animationPhase + index * 0.5) * 0.2;
        ctx.shadowColor = `hsl(${baseHue}, 100%, 80%)`;
        ctx.shadowBlur = 5 + glowIntensity * 15;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      
      // Add animated peak indicator for high amplitudes
      if (normalizedAmp > 0.7) {
        const peakAnimation = Math.sin(animationPhase * 3 + index) * 0.3 + 0.7;
        const peakY = y - 8;
        const peakHeight = 4;
        
        ctx.fillStyle = `hsl(${baseHue + 40}, 100%, ${85 + peakAnimation * 15}%)`;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x + barW/4, peakY, barW/2, peakHeight, 2);
        } else {
          // Fallback for browsers without roundRect support
          ctx.rect(x + barW/4, peakY, barW/2, peakHeight);
        }
        ctx.fill();
        
        // Peak glow
        ctx.shadowColor = `hsl(${baseHue + 40}, 100%, 90%)`;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = peakAnimation;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      
      // Real frequency labels with smart positioning
      if (barHeight > maxBarHeight * 0.2 || index % Math.max(1, Math.floor(totalBars / 8)) === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        
        // Frequency value
        const labelY = barHeight > 40 ? y - 12 : baseY + 15;
        ctx.fillText(`${freq.toFixed(0)}Hz`, x + barW/2, labelY);
        
        // Amplitude percentage for debugging/real data verification
        if (normalizedAmp > 0.5) {
          ctx.fillStyle = '#ffff88';
          ctx.font = '7px monospace';
          ctx.fillText(`${(normalizedAmp * 100).toFixed(0)}%`, x + barW/2, labelY + 10);
        }
      }
    });
    
    // Draw bottom axis line
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, baseY + 2);
    ctx.lineTo(w - 20, baseY + 2);
    ctx.stroke();
    
    // Real-time data info
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`🎵 Real Frequencies: ${frequencies.length} active`, 10, 20);
    
    const avgFreq = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    ctx.fillStyle = '#88ffff';
    ctx.font = '9px monospace';
    ctx.fillText(`Avg: ${avgFreq.toFixed(1)}Hz`, 10, 35);
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
    // This function is now handled by the smooth waveform with idle animation
    // Just draw the center text
    const centerY = h / 2;
    
    // Animated text glow
    const textGlow = Math.sin(timeRef.current * 2) * 0.3 + 0.7;
    
    ctx.fillStyle = `rgba(0, 255, 136, ${textGlow})`;
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fillText('🎵 Zyrkom Audio Visualizer Ready', w / 2, centerY + 60);
    
    ctx.fillStyle = `rgba(136, 136, 136, ${textGlow * 0.8})`;
    ctx.font = '12px monospace';
    ctx.shadowBlur = 5;
    ctx.fillText('Waiting for Spanish Anthem audio stream...', w / 2, centerY + 80);
    
    ctx.shadowBlur = 0;
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