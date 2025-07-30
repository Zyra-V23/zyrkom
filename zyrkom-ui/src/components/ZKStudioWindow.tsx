import React, { useState, useRef, useCallback } from 'react';
import FloatingWindow from './FloatingWindow';

interface AudioFile {
  id: string;
  name: string;
  type: 'audio' | 'zkp' | 'json';
  file: File;
  url?: string;
  metadata?: any;
}

interface Track {
  id: string;
  name: string;
  audioFile?: AudioFile;
  volume: number;
  muted: boolean;
  solo: boolean;
  pattern: boolean[]; // 16-step pattern
}

const ZKStudioWindow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', name: 'Kick', volume: 0.8, muted: false, solo: false, pattern: new Array(16).fill(false) },
    { id: '2', name: 'Snare', volume: 0.7, muted: false, solo: false, pattern: new Array(16).fill(false) },
    { id: '3', name: 'Hi-Hat', volume: 0.6, muted: false, solo: false, pattern: new Array(16).fill(false) },
    { id: '4', name: 'Bass', volume: 0.9, muted: false, solo: false, pattern: new Array(16).fill(false) },
  ]);
  const [loadedFiles, setLoadedFiles] = useState<AudioFile[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('1');
  const [zkpData, setZkpData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const handleFileLoad = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const fileType = file.name.endsWith('.zkp') ? 'zkp' : 
                      file.name.endsWith('.json') ? 'json' : 'audio';
      
      const audioFile: AudioFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: fileType,
        file: file,
        url: URL.createObjectURL(file)
      };

      // Handle different file types
      if (fileType === 'json') {
        // Parse JSON metadata
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const metadata = JSON.parse(e.target?.result as string);
            audioFile.metadata = metadata;
            console.log('📄 JSON metadata loaded:', metadata);
          } catch (err) {
            console.error('❌ Error parsing JSON:', err);
          }
        };
        reader.readAsText(file);
      } else if (fileType === 'zkp') {
        // Handle ZKP proof files
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          console.log('🔐 ZKP proof loaded, size:', arrayBuffer.byteLength, 'bytes');
          setZkpData({
            filename: file.name,
            size: arrayBuffer.byteLength,
            hash: `0x${Array.from(new Uint8Array(arrayBuffer.slice(0, 16)))
              .map(b => b.toString(16).padStart(2, '0')).join('')}...`
          });
        };
        reader.readAsArrayBuffer(file);
      }

      setLoadedFiles(prev => [...prev, audioFile]);
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      setIsPlaying(true);
      const stepDuration = (60 / bpm / 4) * 1000; // 16th notes
      
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % 16);
      }, stepDuration);
    }
  }, [isPlaying, bpm]);

  const handleStepToggle = useCallback((trackId: string, stepIndex: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, pattern: track.pattern.map((step, i) => i === stepIndex ? !step : step) }
        : track
    ));
  }, []);

  const handleTrackControl = useCallback((trackId: string, property: 'muted' | 'solo', value: boolean) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, [property]: value } : track
    ));
  }, []);

  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, volume } : track
    ));
  }, []);

  const assignFileToTrack = useCallback((file: AudioFile, trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, audioFile: file } : track
    ));
  }, []);

  return (
    <FloatingWindow
      title="🎛️ ZK Studio - Zero-Knowledge DAW"
      onClose={onClose}
      icon="/zk-studio-icon.svg"
      initialWidth={900}
      initialHeight={600}
    >
      <div className="p-4 h-full bg-gray-900 text-white font-mono">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-4 bg-gray-800 p-3 rounded">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlay}
              className={`px-4 py-2 rounded font-bold ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? '⏸️ STOP' : '▶️ PLAY'}
            </button>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">BPM:</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                min="60"
                max="200"
              />
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
              <span className="text-sm text-gray-300">
                {isPlaying ? `Step: ${currentStep + 1}/16` : 'Ready'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
            >
              📁 Load Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".mp3,.wav,.ogg,.zkp,.json"
              onChange={handleFileLoad}
              className="hidden"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-4 h-full">
          {/* Sequencer Grid */}
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-3 text-blue-400">🎵 Pattern Sequencer</h3>
            <div className="bg-gray-800 p-4 rounded">
              {/* Step Numbers */}
              <div className="flex mb-2">
                <div className="w-20"></div>
                {Array.from({ length: 16 }, (_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 text-center text-xs py-1 ${
                      i === currentStep ? 'bg-yellow-500 text-black' : 'text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Track Rows */}
              {tracks.map(track => (
                <div key={track.id} className="flex items-center mb-2">
                  {/* Track Controls */}
                  <div className="w-20 flex flex-col space-y-1">
                    <div className="text-xs font-bold truncate">{track.name}</div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleTrackControl(track.id, 'muted', !track.muted)}
                        className={`text-xs px-1 py-0.5 rounded ${
                          track.muted ? 'bg-red-600' : 'bg-gray-600'
                        }`}
                      >
                        M
                      </button>
                      <button
                        onClick={() => handleTrackControl(track.id, 'solo', !track.solo)}
                        className={`text-xs px-1 py-0.5 rounded ${
                          track.solo ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}
                      >
                        S
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={track.volume}
                      onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                      className="w-full h-1"
                    />
                  </div>

                  {/* Pattern Steps */}
                  {track.pattern.map((active, stepIndex) => (
                    <button
                      key={stepIndex}
                      onClick={() => handleStepToggle(track.id, stepIndex)}
                      className={`flex-1 aspect-square mx-0.5 rounded border-2 transition-all ${
                        active 
                          ? 'bg-orange-500 border-orange-400' 
                          : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                      } ${stepIndex === currentStep ? 'ring-2 ring-yellow-400' : ''}`}
                    >
                      {active && <div className="w-full h-full bg-orange-400 rounded-sm"></div>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* File Browser & ZK Panel */}
          <div className="w-80 space-y-4">
            {/* File Browser */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-bold mb-3 text-green-400">📁 File Browser</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {loadedFiles.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-4">
                    No files loaded<br/>
                    <span className="text-xs">Drop .mp3, .wav, .zkp, .json files</span>
                  </div>
                ) : (
                  loadedFiles.map(file => (
                    <div 
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                      onClick={() => assignFileToTrack(file, selectedTrack)}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium truncate">{file.name}</div>
                        <div className="text-xs text-gray-400">
                          {file.type === 'zkp' ? '🔐 ZK Proof' : 
                           file.type === 'json' ? '📄 Metadata' : '🎵 Audio'}
                        </div>
                      </div>
                      <div className="text-xs text-blue-400">
                        Click to assign
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ZK Verification Panel */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-bold mb-3 text-purple-400">🔐 ZK Verification</h3>
              {zkpData ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-400">File:</span>
                    <div className="text-green-400 font-mono text-xs">{zkpData.filename}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Size:</span>
                    <div className="text-blue-400">{zkpData.size} bytes</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Hash:</span>
                    <div className="text-orange-400 font-mono text-xs break-all">{zkpData.hash}</div>
                  </div>
                  <button className="w-full mt-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm">
                    ✅ Verify Proof
                  </button>
                </div>
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">
                  No ZK proofs loaded<br/>
                  <span className="text-xs">Load .zkp files to verify</span>
                </div>
              )}
            </div>

            {/* Track Assignment */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-bold mb-3 text-cyan-400">🎛️ Track Assignment</h3>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Target Track:</label>
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  {tracks.map(track => (
                    <option key={track.id} value={track.id}>
                      {track.name} {track.audioFile ? '🎵' : ''}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500">
                  Click any file above to assign to selected track
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-bold mb-3 text-yellow-400">📊 Status</h3>
              <div className="text-sm space-y-1">
                <div>🎵 Audio Files: {loadedFiles.filter(f => f.type === 'audio').length}</div>
                <div>🔐 ZK Proofs: {loadedFiles.filter(f => f.type === 'zkp').length}</div>
                <div>📄 Metadata: {loadedFiles.filter(f => f.type === 'json').length}</div>
                <div>🎛️ Active Tracks: {tracks.filter(t => t.audioFile).length}/{tracks.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FloatingWindow>
  );
};

export default ZKStudioWindow;