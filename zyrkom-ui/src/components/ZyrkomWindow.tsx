import React, { useState, useRef, useEffect, useCallback } from 'react';
import FloatingWindow from './FloatingWindow';
import AudioVisualizer from './AudioVisualizer';
import { Download } from 'lucide-react';

interface ZyrkomWindowProps {
  onClose: () => void;
}

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
  const [status, setStatus] = useState<string>('🎵 Listo para generar Himno de España');
  const [output, setOutput] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [harmonicData, setHarmonicData] = useState<{cents: number[], timestamp: number} | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);

  // Cleanup on unmount - close WebSocket cleanly
  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('🔌 Closing WebSocket connection...');
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, []);

  // Simplified WebSocket connection - stable and permanent
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    console.log('🔗 Connecting to WebSocket...');
    setConnectionStatus('connecting');
    setError(null);
    
    const ws = new WebSocket('ws://localhost:8081');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      setConnectionStatus('connected');
      setStatus('🎵 Listo para generar Himno de España');
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'status':
            setStatus(message.message);
            break;
            
          case 'output':
            setOutput(prev => [...prev.slice(-50), message.data]);
            break;
            
          case 'audio-start':
            setIsPlaying(true);
            setStatus('🎵 ¡Reproduciendo Himno de España!');
            break;
            
          case 'audio-data':
            if (message.data) {
              setAudioData(message.data);
              if (message.data.isPlaying !== undefined) {
                setIsPlaying(message.data.isPlaying);
              }
            }
            break;
            
          case 'harmonic-data':
            if (message.data) {
              setHarmonicData(message.data);
            }
            break;
            
          case 'zk-progress':
            setProgress(prev => Math.min(prev + 5, 95));
            if (message.stage) {
              setStatus(message.message || `🔐 Progreso ZK: ${message.stage}`);
            }
            break;
            
          case 'complete':
            setIsGenerating(false);
            setProgress(100);
            setIsPlaying(false);
            setStatus('✅ ¡Himno generado exitosamente!');
            
            if (message.data?.json_data) {
              setZkProofData(message.data.json_data);
            }
            break;
            
          case 'error':
            setError(message.message);
            setIsGenerating(false);
            setIsPlaying(false);
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket connection failed:', error);
      setConnectionStatus('disconnected');
      setError('No se puede conectar al backend. ¿Está corriendo el servidor?');
    };

    ws.onclose = (event) => {
      console.log('📴 WebSocket connection closed');
      setConnectionStatus('disconnected');
      
      // Only set error for unexpected closures
      if (event.code !== 1000 && event.code !== 1001) {
        setStatus('⚠️ Conexión cerrada inesperadamente');
      }
    };
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

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

        {/* Audio Visualization */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold">🎵 Real-Time Audio Visualization</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' : 
                connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></div>
              <span className="text-xs text-gray-600">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          </div>
          <AudioVisualizer 
            audioData={audioData}
            isPlaying={isPlaying}
            width={750}
            height={180}
            className="mb-2"
          />
          {harmonicData && (
            <div className="text-xs text-gray-500 font-mono">
              🎼 Harmonic intervals: {harmonicData.cents.map(c => `${c.toFixed(0)} cents`).join(', ')}
            </div>
          )}
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

          {/* Enhanced Status Display */}
          <div className="mt-2 p-3 bg-black text-green-400 font-mono text-xs rounded border border-gray-600">
            <div className="flex justify-between items-center mb-1">
              <span>Status: {status}</span>
              <span className="text-gray-400">
                {audioData && `${audioData.frequencies?.length || 0} freq`}
              </span>
            </div>
            {isPlaying && audioData && (
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="text-yellow-400">
                  🎵 Audio: {audioData.notes?.join(', ') || 'streaming...'}
                </div>
                <div className="text-cyan-400">
                  📊 Data: {audioData.timestamp ? new Date(audioData.timestamp).toLocaleTimeString() : ''}
                </div>
              </div>
            )}
            {connectionStatus !== 'connected' && (
              <div className="flex justify-between items-center mt-2">
                <div className="text-red-400">
                  ⚠️ WebSocket: {connectionStatus}
                </div>
                <button
                  className="button-95 text-xs px-2 py-1"
                  onClick={connectWebSocket}
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'connecting' ? 'Conectando...' : '🔄 Reconectar'}
                </button>
              </div>
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