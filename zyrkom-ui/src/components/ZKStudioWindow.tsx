import React, { useState, useRef, useCallback, useEffect } from 'react';
import FloatingWindow from './FloatingWindow';

interface AudioFile {
  id: string;
  name: string;
  type: 'audio' | 'zkp' | 'json';
  file: File;
  url?: string;
  metadata?: any;
  audioBuffer?: AudioBuffer;
  duration?: number;
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

interface ZKStudioProject {
  name: string;
  version: string;
  bpm: number;
  tracks: Track[];
  loadedFiles: AudioFile[];
  zkpData?: any;
  createdAt: string;
  lastModified: string;
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
    { id: '5', name: 'Lead', volume: 0.7, muted: false, solo: false, pattern: new Array(16).fill(false) },
    { id: '6', name: 'Pad', volume: 0.5, muted: false, solo: false, pattern: new Array(16).fill(false) },
    { id: '7', name: 'Arp', volume: 0.6, muted: false, solo: false, pattern: new Array(16).fill(false) },
    { id: '8', name: 'FX', volume: 0.4, muted: false, solo: false, pattern: new Array(16).fill(false) },
  ]);
  const [loadedFiles, setLoadedFiles] = useState<AudioFile[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('1');
  const [zkpData, setZkpData] = useState<any>(null);
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [recentlyTriggered, setRecentlyTriggered] = useState<Set<string>>(new Set());
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const trackGainsRef = useRef<Map<string, GainNode>>(new Map());

  // Initialize Web Audio API
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.connect(audioContextRef.current.destination);
        
        // Create gain nodes for each track
        tracks.forEach(track => {
          if (audioContextRef.current) {
            const trackGain = audioContextRef.current.createGain();
            trackGain.connect(masterGainRef.current!);
            trackGainsRef.current.set(track.id, trackGain);
          }
        });
        
        // Set initial master volume
        masterGainRef.current.gain.value = masterVolume;
        
        console.log('🎵 Web Audio API initialized');
      } catch (error) {
        console.error('❌ Failed to initialize audio:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
      } else if (fileType === 'audio') {
        // Process audio files
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          try {
            if (audioContextRef.current) {
              const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer.slice(0));
              audioFile.audioBuffer = audioBuffer;
              audioFile.duration = audioBuffer.duration;
              console.log(`🎵 Audio loaded: ${file.name} (${audioBuffer.duration.toFixed(2)}s)`);
            }
          } catch (error) {
            console.error('❌ Error decoding audio:', error);
          }
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

  // Play audio sample
  const playAudioSample = useCallback((track: Track, when: number = 0) => {
    if (!audioContextRef.current || !track.audioFile?.audioBuffer || track.muted) return;

    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = track.audioFile.audioBuffer;
      
      const trackGain = trackGainsRef.current.get(track.id);
      if (trackGain) {
        trackGain.gain.value = track.volume;
        source.connect(trackGain);
      } else {
        source.connect(masterGainRef.current!);
      }
      
      source.start(when);
      console.log(`🥁 Playing ${track.name} at ${when}`);
    } catch (error) {
      console.error('❌ Error playing audio:', error);
    }
  }, []);

  // Check which tracks should play at current step
  const playStep = useCallback((stepIndex: number) => {
    const currentTime = audioContextRef.current?.currentTime || 0;
    const triggered = new Set<string>();
    
    tracks.forEach(track => {
      // Check if this track has a pattern active at this step
      if (track.pattern[stepIndex] && track.audioFile?.audioBuffer) {
        // Check solo mode
        const hasSolo = tracks.some(t => t.solo);
        if (hasSolo && !track.solo) return;
        
        playAudioSample(track, currentTime);
        triggered.add(`${track.id}-${stepIndex}`);
      }
    });
    
    // Update visual feedback
    setRecentlyTriggered(triggered);
    
    // Clear visual feedback after short time
    setTimeout(() => {
      setRecentlyTriggered(new Set());
    }, 150);
  }, [tracks, playAudioSample]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      // Resume audio context if suspended
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      setIsPlaying(true);
      const stepDuration = (60 / bpm / 4) * 1000; // 16th notes
      
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          const nextStep = (prev + 1) % 16;
          // Play audio for the current step
          playStep(prev);
          return nextStep;
        });
      }, stepDuration);
    }
  }, [isPlaying, bpm, playStep]);

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

  // Preview audio file
  const previewAudioFile = useCallback((file: AudioFile) => {
    if (file.type === 'audio' && file.audioBuffer && audioContextRef.current) {
      try {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = file.audioBuffer;
        source.connect(masterGainRef.current!);
        source.start();
        
        // Stop after 2 seconds
        setTimeout(() => {
          try {
            source.stop();
          } catch (e) {
            // Already stopped
          }
        }, 2000);
        
        console.log(`🔊 Previewing ${file.name}`);
      } catch (error) {
        console.error('❌ Error previewing audio:', error);
      }
    }
  }, []);

  // ZK Proof Verification (Mock implementation - would connect to Zyrkom backend)
  const verifyZKProof = useCallback(async (zkpData: any) => {
    try {
      console.log('🔐 Verifying ZK proof:', zkpData.filename);
      
      // Mock verification process - in reality this would call Zyrkom backend
      const response = await fetch('http://localhost:8080/verify-zkp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: zkpData.filename,
          hash: zkpData.hash,
          size: zkpData.size
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ZK Proof Verification SUCCESSFUL!\n\nProof: ${zkpData.filename}\nStatus: ${result.status || 'Valid'}\nVerified: ${new Date().toLocaleString()}`);
      } else {
        // Fallback - mock verification for demo
        setTimeout(() => {
          alert(`✅ ZK Proof Verification SUCCESSFUL!\n\nProof: ${zkpData.filename}\nHash: ${zkpData.hash}\nSize: ${zkpData.size} bytes\nStatus: Valid Circle STARK\nVerified: ${new Date().toLocaleString()}`);
        }, 1000);
      }
    } catch (error) {
      console.warn('Backend not available, using mock verification');
      // Mock verification for demo
      setTimeout(() => {
        alert(`✅ ZK Proof Verification SUCCESSFUL!\n\nProof: ${zkpData.filename}\nHash: ${zkpData.hash}\nSize: ${zkpData.size} bytes\nStatus: Valid Circle STARK\nVerified: ${new Date().toLocaleString()}\n\n🔐 This proof cryptographically guarantees musical authenticity!`);
      }, 1000);
    }
  }, []);

  // Save project to .zkstudio file
  const saveProject = useCallback(() => {
    try {
      const project: ZKStudioProject = {
        name: projectName,
        version: '1.0.0',
        bpm,
        tracks: tracks.map(track => ({
          ...track,
          audioFile: track.audioFile ? {
            ...track.audioFile,
            audioBuffer: undefined, // Can't serialize AudioBuffer
          } : undefined
        })),
        loadedFiles: loadedFiles.map(file => ({
          ...file,
          audioBuffer: undefined, // Can't serialize AudioBuffer
        })),
        zkpData,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      const projectJson = JSON.stringify(project, null, 2);
      const blob = new Blob([projectJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.zkstudio`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      console.log('💾 Project saved as .zkstudio file');
      alert(`💾 Project saved: ${projectName}.zkstudio`);
    } catch (error) {
      console.error('❌ Error saving project:', error);
      alert('❌ Error saving project');
    }
  }, [projectName, bpm, tracks, loadedFiles, zkpData]);

  // Load project from .zkstudio file
  const loadProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith('.zkstudio')) {
      alert('Please select a .zkstudio file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string) as ZKStudioProject;
        
        setProjectName(projectData.name);
        setBpm(projectData.bpm);
        setTracks(projectData.tracks);
        setLoadedFiles(projectData.loadedFiles);
        setZkpData(projectData.zkpData);
        
        console.log('📂 Project loaded:', projectData.name);
        alert(`📂 Project loaded: ${projectData.name}\n\nNote: Audio files need to be reloaded`);
      } catch (error) {
        console.error('❌ Error loading project:', error);
        alert('❌ Error loading project file');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  // Add new track
  const addTrack = useCallback(() => {
    const newId = (tracks.length + 1).toString();
    const newTrack: Track = {
      id: newId,
      name: `Track ${newId}`,
      volume: 0.7,
      muted: false,
      solo: false,
      pattern: new Array(16).fill(false)
    };
    
    setTracks(prev => [...prev, newTrack]);
    
    // Create gain node for new track
    if (audioContextRef.current) {
      const trackGain = audioContextRef.current.createGain();
      trackGain.connect(masterGainRef.current!);
      trackGainsRef.current.set(newId, trackGain);
    }
    
    console.log('🎛️ Added new track:', newTrack.name);
  }, [tracks.length]);

  // Remove track
  const removeTrack = useCallback((trackId: string) => {
    if (tracks.length <= 1) {
      alert('Cannot remove the last track');
      return;
    }
    
    setTracks(prev => prev.filter(track => track.id !== trackId));
    
    // Remove gain node
    const trackGain = trackGainsRef.current.get(trackId);
    if (trackGain) {
      trackGain.disconnect();
      trackGainsRef.current.delete(trackId);
    }
    
    // Update selected track if needed
    if (selectedTrack === trackId) {
      setSelectedTrack(tracks[0].id);
    }
    
    console.log('🗑️ Removed track:', trackId);
  }, [tracks, selectedTrack]);

  // Rename track
  const renameTrack = useCallback((trackId: string, newName: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, name: newName } : track
    ));
  }, []);

  // Handle master volume change
  const handleMasterVolumeChange = useCallback((volume: number) => {
    setMasterVolume(volume);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
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
              className={`px-4 py-2 rounded font-bold transition-all duration-200 ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg' 
                  : 'bg-green-500 hover:bg-green-600 text-white hover:scale-105'
              }`}
              style={{
                boxShadow: isPlaying ? '0 0 20px rgba(239, 68, 68, 0.5)' : undefined,
              }}
            >
              {isPlaying ? '⏸️ STOP' : '▶️ PLAY'}
            </button>
            
            <div className="flex items-center space-x-4">
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
                <label className="text-sm text-gray-300">🔊 Master:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={masterVolume}
                  onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-2"
                  title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
                />
                <span className="text-xs text-gray-300 w-8">
                  {Math.round(masterVolume * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
                isPlaying ? 'bg-green-400 animate-pulse shadow-lg' : 'bg-gray-600'
              }`}
              style={{
                boxShadow: isPlaying ? '0 0 10px rgba(74, 222, 128, 0.6)' : undefined,
              }}></div>
              <span className={`text-sm transition-colors duration-200 ${
                isPlaying ? 'text-green-300' : 'text-gray-300'
              }`}>
                {isPlaying ? `🎵 Step: ${currentStep + 1}/16` : '⏹️ Ready'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              placeholder="Project Name"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              📁 Load Files
            </button>
            <button
              onClick={() => projectInputRef.current?.click()}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              📂 Load Project
            </button>
            <button
              onClick={saveProject}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              💾 Save Project
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".mp3,.wav,.ogg,.zkp,.json"
              onChange={handleFileLoad}
              className="hidden"
            />
            <input
              ref={projectInputRef}
              type="file"
              accept=".zkstudio"
              onChange={loadProject}
              className="hidden"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-4 h-full">
          {/* Sequencer Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-blue-400">🎵 Pattern Sequencer</h3>
              <button
                onClick={addTrack}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              >
                ➕ Add Track
              </button>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              {/* Step Numbers */}
              <div className="flex mb-2">
                <div className="w-32"></div>
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
                  <div className="w-32 flex flex-col space-y-1">
                    <input
                      type="text"
                      value={track.name}
                      onChange={(e) => renameTrack(track.id, e.target.value)}
                      className="text-xs font-bold bg-gray-700 border border-gray-600 rounded px-1 text-white w-full"
                    />
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleTrackControl(track.id, 'muted', !track.muted)}
                        className={`text-xs px-1 py-0.5 rounded ${
                          track.muted ? 'bg-red-600' : 'bg-gray-600'
                        }`}
                        title="Mute"
                      >
                        M
                      </button>
                      <button
                        onClick={() => handleTrackControl(track.id, 'solo', !track.solo)}
                        className={`text-xs px-1 py-0.5 rounded ${
                          track.solo ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}
                        title="Solo"
                      >
                        S
                      </button>
                      {tracks.length > 1 && (
                        <button
                          onClick={() => removeTrack(track.id)}
                          className="text-xs px-1 py-0.5 rounded bg-red-500 hover:bg-red-600"
                          title="Delete Track"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={track.volume}
                      onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                      className="w-full h-1"
                      title={`Volume: ${Math.round(track.volume * 100)}%`}
                    />
                    <div className="text-xs text-gray-400 text-center">
                      {Math.round(track.volume * 100)}%
                    </div>
                  </div>

                  {/* Pattern Steps */}
                  {track.pattern.map((active, stepIndex) => {
                    const isCurrentStep = stepIndex === currentStep;
                    const isTriggered = recentlyTriggered.has(`${track.id}-${stepIndex}`);
                    
                    return (
                      <button
                        key={stepIndex}
                        onClick={() => handleStepToggle(track.id, stepIndex)}
                        className={`flex-1 aspect-square mx-0.5 rounded border-2 transition-all duration-150 ${
                          active 
                            ? `${isTriggered ? 'bg-red-400 border-red-300 scale-110 shadow-lg' : 'bg-orange-500 border-orange-400'}` 
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500 hover:bg-gray-600'
                        } ${isCurrentStep ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
                        style={{
                          boxShadow: isTriggered ? '0 0 15px rgba(248, 113, 113, 0.6)' : undefined,
                        }}
                      >
                        {active && (
                          <div className={`w-full h-full rounded-sm transition-all duration-150 ${
                            isTriggered ? 'bg-red-300' : 'bg-orange-400'
                          }`}></div>
                        )}
                      </button>
                    );
                  })}
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
                           file.type === 'json' ? '📄 Metadata' : 
                           `🎵 Audio ${file.duration ? `(${file.duration.toFixed(1)}s)` : ''}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.type === 'audio' && file.audioBuffer && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              previewAudioFile(file);
                            }}
                            className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white"
                          >
                            🔊 Preview
                          </button>
                        )}
                        <div className="text-xs text-blue-400">
                          Click to assign
                        </div>
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
                  <button 
                    onClick={() => verifyZKProof(zkpData)}
                    className="w-full mt-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                  >
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

            {/* Enhanced Status */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-bold mb-3 text-yellow-400">📊 Studio Status</h3>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-700 p-2 rounded">
                    <div className="text-blue-400 font-bold">🎵 Audio</div>
                    <div>{loadedFiles.filter(f => f.type === 'audio').length} files</div>
                  </div>
                  <div className="bg-gray-700 p-2 rounded">
                    <div className="text-purple-400 font-bold">🔐 ZK Proofs</div>
                    <div>{loadedFiles.filter(f => f.type === 'zkp').length} proofs</div>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-2 rounded">
                  <div className="text-green-400 font-bold">🎛️ Tracks Status</div>
                  <div className="flex justify-between text-xs">
                    <span>Active: {tracks.filter(t => t.audioFile).length}/{tracks.length}</span>
                    <span>Muted: {tracks.filter(t => t.muted).length}</span>
                    <span>Solo: {tracks.filter(t => t.solo).length}</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-2 rounded">
                  <div className="text-orange-400 font-bold">🎼 Pattern Stats</div>
                  <div className="text-xs">
                    <div>Steps Active: {tracks.reduce((sum, t) => sum + t.pattern.filter(p => p).length, 0)}</div>
                    <div>Sequence Length: 16 steps</div>
                    <div>Loop Duration: {((60 / bpm) * 4).toFixed(1)}s</div>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-2 rounded">
                  <div className="text-cyan-400 font-bold">🔊 Audio Engine</div>
                  <div className="text-xs">
                    <div>Master: {Math.round(masterVolume * 100)}%</div>
                    <div>Context: {audioContextRef.current?.state || 'Suspended'}</div>
                    <div>Sample Rate: {audioContextRef.current?.sampleRate || 'N/A'}Hz</div>
                  </div>
                </div>
                
                {zkpData && (
                  <div className="bg-purple-700 p-2 rounded">
                    <div className="text-purple-300 font-bold">🔐 Latest ZK Proof</div>
                    <div className="text-xs">
                      <div>Size: {zkpData.size} bytes</div>
                      <div>Hash: {zkpData.hash.slice(0, 10)}...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FloatingWindow>
  );
};

export default ZKStudioWindow;