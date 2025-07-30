import React, { useState, useRef, useEffect } from 'react';
import FloatingWindow from './FloatingWindow';
import { Download, Play, Square } from 'lucide-react';

interface ZyrkomWindowProps {
  onClose: () => void;
}

interface ZKProofData {
  musical_constraints: Array<{
    note_name: string;
    frequency_hz: number;
    cents_from_a440: number;
    interval_type: string;
  }>;
  public_inputs: {
    anthem_name: string;
    total_duration_ms: number;
    tempo_bpm: number;
    key_signature: string;
    time_signature: string;
  };
  proof_generation_info: {
    timestamp: string;
    generation_time_ms: number;
    proof_size_bytes: number;
    binary_file: string;
    source_file: string;
  };
  stark_info: {
    security_level: number;
    field: string;
    constraints_count: number;
    trace_length: number;
    blowup_factor: number;
  };
}

const ZyrkomWindow: React.FC<ZyrkomWindowProps> = ({ onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zkProofData, setZkProofData] = useState<ZKProofData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Listo para generar Himno de España');
  const [output, setOutput] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const wsRef = useRef<WebSocket | null>(null);
  const frequencyDataRef = useRef<number[]>([]);
  const timeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const drawWaveform = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple default visualization
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#00ff0033';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (canvas.height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let i = 0; i <= 20; i++) {
      const x = (canvas.width / 20) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Center text
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Audio Waveform Visualization', canvas.width / 2, canvas.height / 2);
  };

  // Initialize canvas visualization on mount
  useEffect(() => {
    drawWaveform();
  }, []);

  const startVisualization = () => {
    console.log('🎵 Starting visualization...');
    setIsPlaying(true);
  };

  const generateSpanishAnthem = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(10);
    setStatus('🇪🇸 Iniciando generación del Himno de España...');

    try {
      setProgress(30);
      setStatus('🎵 Conectando al backend de Rust...');
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      // Make request to Rust backend
      const response = await fetch('http://localhost:8080/generate-spanish-anthem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.json_data) {
        setZkProofData(data.json_data);
        setStatus('✅ ¡Himno generado exitosamente!');
        setProgress(100);
        startVisualization();
      } else {
        throw new Error('No se pudo generar la prueba ZK');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStatus('❌ Error en la generación');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (zkProofData) {
      downloadFile(
        'spanish_anthem_marcha_real.json',
        JSON.stringify(zkProofData, null, 2),
        'application/json'
      );
    }
  };

  const downloadZKP = async () => {
    try {
      const response = await fetch('http://localhost:8080/download-zkp');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spanish_anthem_marcha_real.zkp';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download ZKP file');
    }
  };

  return (
    <FloatingWindow
      title="Zyrkom - Zero-Knowledge Musical Physics"
      onClose={onClose}
      width={800}
      height={600}
      minWidth={600}
      minHeight={400}
    >
      <div className="h-full flex flex-col p-4 bg-gray-100">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <img src="/zyrkom-icon.svg" alt="" width="24" height="24" />
            Spanish National Anthem - ZK Proof Generator
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Generate Zero-Knowledge proofs for the Marcha Real using musical physics
          </p>
          <div className="text-xs text-blue-600 mt-1 font-mono">
            🔐 Powered by <strong>StwoProver</strong> (Circle STARKs) + Musical Physics Engine
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2">Audio Waveform</h3>
          <canvas
            ref={canvasRef}
            width={750}
            height={150}
            className="wave-canvas"
          />
        </div>

        {/* Control Panel */}
        <div className="mb-4">
          <button
            className="button-95 font-bold"
            onClick={generateSpanishAnthem}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : '🎵 Generate Spanish Anthem ZK Proof'}
          </button>
          
          {isGenerating && (
            <div className="mt-2">
              <div className="bg-white border-2 border-gray-400 h-4">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs mt-1">Progress: {progress}%</p>
            </div>
          )}

          {/* Status Display */}
          <div className="mt-2 p-2 bg-black text-green-400 font-mono text-xs rounded">
            <div className="mb-1">Status: {status}</div>
            {isPlaying && (
              <div className="text-yellow-400">🎵 Audio reproduciéndose en tiempo real...</div>
            )}
          </div>
        </div>

        {/* Real-time Output Terminal */}
        {output.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold mb-2">Output en Tiempo Real</h3>
            <div className="bg-black text-green-400 font-mono text-xs p-3 h-32 overflow-y-auto rounded border">
              {output.map((line, index) => (
                <div key={index} className="mb-1">{line}</div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {zkProofData && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold">ZK Proof Generated!</h3>
              <div className="flex gap-2">
                <button
                  className="button-95 text-xs flex items-center gap-1"
                  onClick={downloadJSON}
                >
                  <Download size={12} />
                  Download JSON
                </button>
                <button
                  className="button-95 text-xs flex items-center gap-1"
                  onClick={downloadZKP}
                >
                  <Download size={12} />
                  Download ZKP
                </button>
              </div>
            </div>
            
            <div className="json-display flex-1">
              <pre className="text-xs">
                {JSON.stringify(zkProofData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </FloatingWindow>
  );
};

export default ZyrkomWindow;