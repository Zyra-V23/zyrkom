import React, { useState, useEffect, useRef } from 'react';
import FloatingWindow from './FloatingWindow';
import { useSound } from '../contexts/SoundContext';
import { useBenchmark, BenchmarkConfig } from '../hooks/useBenchmark';
import { useGameData, Game } from '../contexts/GameDataContext';
import { AudioVisualizer, frequencies } from '../utils/audioVisualizer';

interface BenchWindowProps {
  onClose: () => void;
}

enum BenchmarkState {
  SELECT_GAME = 'SELECT_GAME',
  CONFIGURE = 'CONFIGURE',
  RUNNING = 'RUNNING',
  COMPLETE = 'COMPLETE'
}

interface BenchmarkResults {
  fps: number;
  score: number;
  gpuTier: string;
  timestamp: string;
  game: string;
}

const BenchWindow: React.FC<BenchWindowProps> = ({ onClose }) => {
  const { playSuccess, playError, playMenuSelect } = useSound();
  const { games } = useGameData();
  const [benchmarkState, setBenchmarkState] = useState<BenchmarkState>(BenchmarkState.SELECT_GAME);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [config, setConfig] = useState({
    duration: 30,
    stressLevel: 'STANDARD' as 'STANDARD' | 'EXTREME' | 'STABILITY',
    gameName: ''
  });
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BenchmarkResults | null>(null);
  const [statusMessage, setStatusMessage] = useState('SELECT A GAME TO BENCHMARK');
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<AudioVisualizer | null>(null);
  
  const {
    runBenchmark,
    stopBenchmark,
    isRunning,
    progress: benchmarkProgress
  } = useBenchmark();

  useEffect(() => {
    if (benchmarkState === BenchmarkState.RUNNING && canvasRef.current) {
      visualizerRef.current = new AudioVisualizer(canvasRef.current);
      visualizerRef.current.start();

      let progressInterval: NodeJS.Timeout;
      let currentProgress = 0;

      const updateProgress = () => {
        currentProgress += 1;
        setProgress(currentProgress);
        
        if (currentProgress < 20) {
          setStatusMessage('INITIALIZING WEBGL CONTEXT...');
          visualizerRef.current?.changeFrequency(frequencies.init);
        } else if (currentProgress < 40) {
          setStatusMessage('CREATING 3D SCENE...');
          visualizerRef.current?.changeFrequency(frequencies.running);
        } else if (currentProgress < 60) {
          setStatusMessage('RUNNING PERFORMANCE TEST...');
        } else if (currentProgress < 80) {
          setStatusMessage('ANALYZING RESULTS...');
        } else {
          setStatusMessage('FINALIZING BENCHMARK...');
          visualizerRef.current?.changeFrequency(frequencies.complete);
        }

        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          setBenchmarkState(BenchmarkState.COMPLETE);
          setResults({
            fps: benchmarkProgress.currentFps,
            score: Math.floor(benchmarkProgress.currentFps * 10), // Calculate score from FPS
            gpuTier: 'HIGH',
            timestamp: new Date().toISOString(),
            game: selectedGame?.title || 'Unknown'
          });
          playSuccess();
          visualizerRef.current?.dispose();
        }
      };

      progressInterval = setInterval(updateProgress, config.duration * 1000 / 100);

      return () => {
        clearInterval(progressInterval);
        visualizerRef.current?.dispose();
      };
    }
  }, [benchmarkState, config.duration, benchmarkProgress, playSuccess, selectedGame]);

  const handleGameSelect = (game: Game) => {
    playMenuSelect();
    setSelectedGame(game);
    setConfig(prev => ({ ...prev, gameName: game.title }));
    setBenchmarkState(BenchmarkState.CONFIGURE);
    setStatusMessage('CONFIGURE BENCHMARK SETTINGS');
  };

  const handleStartBenchmark = async () => {
    playMenuSelect();
    setBenchmarkState(BenchmarkState.RUNNING);
    setProgress(0);
    setStatusMessage('INITIALIZING BENCHMARK...');

    try {
      await runBenchmark(config);
    } catch (err) {
      playError();
      setStatusMessage('BENCHMARK FAILED');
      setTimeout(() => {
        setBenchmarkState(BenchmarkState.CONFIGURE);
      }, 2000);
    }
  };

  const handleReset = () => {
    playMenuSelect();
    setBenchmarkState(BenchmarkState.SELECT_GAME);
    setSelectedGame(null);
    setProgress(0);
    setResults(null);
    setStatusMessage('SELECT A GAME TO BENCHMARK');
    setConfig({
      duration: 30,
      stressLevel: 'STANDARD',
      gameName: ''
    });
  };

  const renderContent = () => {
    switch (benchmarkState) {
      case BenchmarkState.SELECT_GAME:
        return (
          <div style={{ color: '#000000' }}>
            <h3 style={{ color: '#000080', marginBottom: '12px', fontSize: '11px' }}>SELECT GAME TO BENCHMARK</h3>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              border: '1px solid #808080', 
              backgroundColor: '#ffffff',
              padding: '4px'
            }}>
              {games.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  style={{
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    borderBottom: '1px solid #e0e0e0',
                    fontFamily: 'var(--font-pixel)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0080ff';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }}
                >
                  {game.title} ({game.platform})
                </div>
              ))}
            </div>
          </div>
        );

      case BenchmarkState.CONFIGURE:
        return (
          <div style={{ color: '#000000' }}>
            <h3 style={{ color: '#000080', marginBottom: '12px', fontSize: '11px' }}>BENCHMARK CONFIGURATION</h3>
            
            <div style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #808080', 
              padding: '8px', 
              marginBottom: '12px',
              fontSize: '9px'
            }}>
              <div>GAME: {selectedGame?.title}</div>
              <div>PLATFORM: {selectedGame?.platform}</div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span>DURATION:</span>
                <select 
                  value={config.duration}
                  onChange={(e) => setConfig({
                    ...config,
                    duration: parseInt(e.target.value)
                  })}
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #808080', 
                    padding: '2px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-pixel)'
                  }}
                >
                  <option value={30}>30 SECONDS</option>
                  <option value={60}>1 MINUTE</option>
                  <option value={120}>2 MINUTES</option>
                  <option value={300}>5 MINUTES</option>
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', alignItems: 'center' }}>
                <span>STRESS LEVEL:</span>
                <select
                  value={config.stressLevel}
                  onChange={(e) => setConfig({
                    ...config,
                    stressLevel: e.target.value as 'STANDARD' | 'EXTREME' | 'STABILITY'
                  })}
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #808080', 
                    padding: '2px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-pixel)'
                  }}
                >
                  <option value="STANDARD">STANDARD</option>
                  <option value="EXTREME">EXTREME</option>
                  <option value="STABILITY">STABILITY</option>
                </select>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={handleStartBenchmark}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#c0c0c0',
                  border: '1px solid #808080',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'var(--font-pixel)',
                  marginRight: '8px'
                }}
              >
                START BENCHMARK
              </button>
              <button
                onClick={() => setBenchmarkState(BenchmarkState.SELECT_GAME)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#c0c0c0',
                  border: '1px solid #808080',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'var(--font-pixel)'
                }}
              >
                BACK
              </button>
            </div>
          </div>
        );
      
      case BenchmarkState.RUNNING:
        return (
          <div style={{ color: '#000000' }}>
            <h3 style={{ color: '#000080', marginBottom: '12px', fontSize: '11px' }}>BENCHMARK IN PROGRESS</h3>
            
            <div style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #808080', 
              padding: '8px', 
              marginBottom: '12px',
              fontSize: '9px'
            }}>
              <div>GAME: {selectedGame?.title}</div>
              <div>MODE: {config.stressLevel}</div>
              <div>PROGRESS: {progress}%</div>
            </div>
            
            {/* Barra de progreso */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #808080', 
              height: '20px', 
              marginBottom: '8px',
              position: 'relative'
            }}>
              <div style={{
                backgroundColor: '#0080ff',
                height: '100%',
                width: `${progress}%`,
                transition: 'width 0.3s'
              }} />
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                textAlign: 'center',
                lineHeight: '20px',
                fontSize: '9px',
                color: '#000000',
                fontFamily: 'var(--font-pixel)'
              }}>
                {progress}%
              </div>
            </div>
            
            <div style={{ 
              textAlign: 'center', 
              fontSize: '9px', 
              marginBottom: '8px',
              color: '#000080'
            }}>
              {statusMessage}
            </div>
            
            <canvas 
              ref={canvasRef}
              style={{
                width: '100%',
                height: '120px',
                backgroundColor: '#000000',
                border: '1px solid #808080'
              }}
            />
            
            <div ref={containerRef} style={{ display: 'none' }}>
              {/* Hidden WebGL canvas */}
            </div>
          </div>
        );
      
      case BenchmarkState.COMPLETE:
        return (
          <div style={{ color: '#000000' }}>
            <h3 style={{ color: '#000080', marginBottom: '12px', fontSize: '11px' }}>BENCHMARK COMPLETE</h3>
            
            <div style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #808080', 
              padding: '8px', 
              marginBottom: '12px',
              fontSize: '9px'
            }}>
              <div>GAME: {selectedGame?.title}</div>
              <div>MODE: {config.stressLevel}</div>
              <div>COMPLETED: {new Date(results?.timestamp || '').toLocaleString()}</div>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                backgroundColor: '#000080', 
                color: '#ffffff', 
                padding: '8px', 
                textAlign: 'center',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '9px' }}>PERFORMANCE SCORE</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{results?.score}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #808080', 
                  padding: '4px', 
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px' }}>AVG FPS</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{results?.fps}</div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #808080', 
                  padding: '4px', 
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px' }}>GPU TIER</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{results?.gpuTier}</div>
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #808080', 
                padding: '8px',
                fontSize: '9px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>RECOMMENDATION:</div>
                <div>
                  {results?.gpuTier === 'LOW' && 'UPGRADE RECOMMENDED FOR BETTER PERFORMANCE'}
                  {results?.gpuTier === 'MEDIUM' && 'ACCEPTABLE PERFORMANCE FOR MOST GAMES'}
                  {results?.gpuTier === 'HIGH' && 'EXCELLENT PERFORMANCE CAPABILITIES'}
                  {results?.gpuTier === 'ULTRA' && 'OUTSTANDING PERFORMANCE - NO UPGRADES NEEDED'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleReset}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#c0c0c0',
                  border: '1px solid #808080',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'var(--font-pixel)'
                }}
              >
                NEW BENCHMARK
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <FloatingWindow
      title="PERFORMANCE BENCHMARK"
      onClose={onClose}
      width={450}
      height={500}
      initialX={200}
      initialY={60}
      minWidth={400}
      minHeight={400}
      maxWidth={600}
      maxHeight={700}
    >
      <div>
        {renderContent()}
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '16px',
          paddingTop: '8px',
          borderTop: '1px solid #808080',
          fontSize: '9px',
          color: '#000080'
        }}>
          {statusMessage}
        </div>
      </div>
    </FloatingWindow>
  );
};

export default BenchWindow; 