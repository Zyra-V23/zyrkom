import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RetroMenu from '../components/RetroMenu';
import RetroWindow from '../components/RetroWindow';
import RetroButton from '../components/RetroButton';
import RetroProgress from '../components/RetroProgress';
import { useSound } from '../contexts/SoundContext';
import { useBenchmark, BenchmarkConfig } from '../hooks/useBenchmark';
import { useGameData } from '../contexts/GameDataContext';
import { AudioVisualizer, frequencies } from '../utils/audioVisualizer';

const menuItems = [
  { label: 'GAME', key: 'GAME', path: '/' },
  { label: 'CONFIG', key: 'CONFIG', path: '/settings' },
  { label: 'BENCH', key: 'BENCH' },
  { label: 'MISC', key: 'MISC', path: '/reports' }
];

enum BenchmarkState {
  SELECT_GAME = 'SELECT_GAME',
  CONFIGURE = 'CONFIGURE',
  RUNNING = 'RUNNING',
  COMPLETE = 'COMPLETE'
}

const BenchmarkScreen: React.FC = () => {
  const navigate = useNavigate();
  const { playSuccess, playError } = useSound();
  const { games, addBenchmarkReport } = useGameData();
  const { runBenchmark, stopBenchmark, isRunning, progress } = useBenchmark();
  
  const [benchmarkState, setBenchmarkState] = useState<BenchmarkState>(BenchmarkState.SELECT_GAME);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [config, setConfig] = useState<BenchmarkConfig>({
    duration: 30,
    stressLevel: 'STANDARD',
    gameName: ''
  });
  const [statusMessage, setStatusMessage] = useState('SELECT A GAME TO BENCHMARK');
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<AudioVisualizer | null>(null);

  useEffect(() => {
    if (isRunning && canvasRef.current) {
      visualizerRef.current = new AudioVisualizer(canvasRef.current);
      visualizerRef.current.start();

      if (progress.progress < 25) {
        setStatusMessage(`INITIALIZING ${progress.currentLevel} TEST...`);
          visualizerRef.current?.changeFrequency(frequencies.init);
      } else if (progress.progress < 50) {
        setStatusMessage(`RUNNING ${progress.currentLevel} BENCHMARK...`);
          visualizerRef.current?.changeFrequency(frequencies.running);
      } else if (progress.progress < 75) {
        setStatusMessage(`ANALYZING ${progress.currentLevel} PERFORMANCE...`);
        } else {
        setStatusMessage(`FINALIZING ${progress.currentLevel} RESULTS...`);
          visualizerRef.current?.changeFrequency(frequencies.complete);
        }

      return () => {
        visualizerRef.current?.dispose();
      };
    }
  }, [isRunning, progress]);

  const handleGameSelect = (game: any) => {
    setSelectedGame(game);
    setConfig(prev => ({ ...prev, gameName: game.title }));
    setBenchmarkState(BenchmarkState.CONFIGURE);
    setStatusMessage('CONFIGURE BENCHMARK SETTINGS');
  };

  const handleStartBenchmark = async () => {
    setBenchmarkState(BenchmarkState.RUNNING);
    setStatusMessage('INITIALIZING BENCHMARK...');

      try {
      const report = await runBenchmark(config);
      setBenchmarkResults(report);
      addBenchmarkReport(report);
      setBenchmarkState(BenchmarkState.COMPLETE);
      setStatusMessage('BENCHMARK COMPLETED SUCCESSFULLY');
      playSuccess();
      } catch (err) {
        playError();
        setStatusMessage('BENCHMARK FAILED');
        setTimeout(() => {
          setBenchmarkState(BenchmarkState.CONFIGURE);
        }, 2000);
      }
  };

  const handleStopBenchmark = () => {
    stopBenchmark();
    setBenchmarkState(BenchmarkState.CONFIGURE);
    setStatusMessage('BENCHMARK CANCELLED');
    visualizerRef.current?.dispose();
  };

  const handleReset = () => {
    setBenchmarkState(BenchmarkState.SELECT_GAME);
    setSelectedGame(null);
    setBenchmarkResults(null);
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
          <RetroWindow title="SELECT GAME" className="h-[50vh]">
            <div className="grid grid-cols-1 gap-2 p-4 overflow-y-auto">
              {games.map((game) => (
                <RetroButton
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className="text-left"
                >
                  {game.title} ({game.platform}) - {game.year}
                </RetroButton>
              ))}
            </div>
          </RetroWindow>
        );

      case BenchmarkState.CONFIGURE:
        return (
          <RetroWindow title="CONFIGURE BENCHMARK" className="h-[50vh]">
            <div className="p-4">
              <div className="mb-4 text-[#00ff00]">
                <div>GAME: {selectedGame?.title}</div>
                <div>PLATFORM: {selectedGame?.platform}</div>
                <div>YEAR: {selectedGame?.year}</div>
              </div>

              <div className="grid grid-cols-[120px,1fr] gap-4 mb-4">
                <span className="text-[#00ff00]">TEST DURATION:</span>
                <select 
                  className="retro-select"
                  value={config.duration}
                  onChange={(e) => setConfig({
                    ...config,
                    duration: parseInt(e.target.value)
                  })}
                >
                  <option value={15}>15 SECONDS</option>
                  <option value={30}>30 SECONDS</option>
                  <option value={60}>1 MINUTE</option>
                  <option value={120}>2 MINUTES</option>
                </select>
              </div>

              <div className="grid grid-cols-[120px,1fr] gap-4 mb-6">
                <span className="text-[#00ff00]">STRESS LEVEL:</span>
                <select
                  className="retro-select"
                  value={config.stressLevel}
                  onChange={(e) => setConfig({
                    ...config,
                    stressLevel: e.target.value as 'STANDARD' | 'EXTREME' | 'STABILITY'
                  })}
                >
                  <option value="STANDARD">STANDARD</option>
                  <option value="EXTREME">EXTREME</option>
                  <option value="STABILITY">STABILITY</option>
                </select>
              </div>

              <div className="flex gap-4">
                <RetroButton onClick={handleStartBenchmark}>
                  START BENCHMARK
                </RetroButton>
                <RetroButton onClick={() => setBenchmarkState(BenchmarkState.SELECT_GAME)}>
                  BACK
                </RetroButton>
              </div>
            </div>
          </RetroWindow>
        );
      
      case BenchmarkState.RUNNING:
        return (
          <RetroWindow title="RUNNING BENCHMARK" className="h-[50vh]">
            <div className="p-4">
              <div className="mb-4 text-[#00ff00]">
                <div>GAME: {selectedGame?.title}</div>
                <div>CURRENT LEVEL: {progress.currentLevel}</div>
                <div>CURRENT FPS: {Math.round(progress.currentFps)}</div>
              </div>
              
              <div className="mb-4">
                <RetroProgress value={progress.progress} max={100} />
                <div className="text-center mt-2 text-[#00ff00]">
                  {Math.round(progress.progress)}% COMPLETE
                </div>
              </div>
              
              <div className="mb-4">
              <canvas 
                ref={canvasRef}
                  width={400}
                  height={200}
                  className="w-full border border-[#00ff00] bg-black"
              />
              </div>
              
              <div className="flex justify-center">
                <RetroButton onClick={handleStopBenchmark}>
                  STOP BENCHMARK
                </RetroButton>
                </div>
            </div>
          </RetroWindow>
        );
      
      case BenchmarkState.COMPLETE:
        return (
          <RetroWindow title="BENCHMARK RESULTS" className="h-[50vh]">
            <div className="p-4">
              <div className="mb-4 text-[#00ff00]">
                <div>GAME: {benchmarkResults?.gameName}</div>
                <div>DATE: {new Date(benchmarkResults?.date).toLocaleString()}</div>
                <div>DURATION: {benchmarkResults?.duration}s</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-[#00ff00]">
                <div>AVERAGE FPS: {benchmarkResults?.averageFps}</div>
                <div>MAX TEMP: {benchmarkResults?.maxTemp}°C</div>
              </div>

              <div className="mb-4">
                <div className="text-[#00ff00] mb-2">PERFORMANCE BY LEVEL:</div>
                {benchmarkResults?.results.map((result: any, index: number) => (
                  <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                    <span>{result.level}:</span>
                    <span>{result.fps} FPS</span>
                    <span>{result.gpuUsage}% GPU</span>
                    <span>{result.score} PTS</span>
                  </div>
                ))}
                    </div>
                    
              {benchmarkResults?.bottlenecks.length > 0 && (
                <div className="mb-4">
                  <div className="text-[#ff0000] mb-2">BOTTLENECKS DETECTED:</div>
                  {benchmarkResults.bottlenecks.map((bottleneck: string, index: number) => (
                    <div key={index} className="text-[#ff0000] text-sm">• {bottleneck}</div>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <div className="text-[#00ff00] mb-2">RECOMMENDATION:</div>
                <div className="text-[#ffff00] text-sm">{benchmarkResults?.recommendation}</div>
              </div>

              <div className="flex gap-4">
                <RetroButton onClick={handleReset}>
                  NEW BENCHMARK
                </RetroButton>
                <RetroButton onClick={() => navigate('/reports')}>
                  VIEW REPORTS
                </RetroButton>
              </div>
            </div>
          </RetroWindow>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#00ff00] font-mono">
      <RetroMenu 
        items={menuItems} 
        onItemClick={(item) => {
          if (item.path) {
            navigate(item.path);
          }
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">RETRO BENCH</h1>
          <div className="text-[#00ff00]">{statusMessage}</div>
      </div>
      
        {renderContent()}
      </div>
    </div>
  );
};

export default BenchmarkScreen;