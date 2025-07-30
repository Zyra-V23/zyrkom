import React, { useState, useRef, useEffect } from 'react';
import FloatingWindow from './FloatingWindow';

interface MusicalDnaData {
  fingerprint: string;
  synesthetic_color: string;
  harmonic_complexity: number;
  interval_preferences: Array<[{ ratio: number; cents: number }, number]>;
  rhythm_signature: number[];
  tonal_centers: string[];
  files?: {
    json_filename?: string;
    zkp_filename?: string | null;
    zkp_size?: number;
  };
}

const MusicalDnaWindow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');
  const [name, setName] = useState('');
  const [songs, setSongs] = useState(['', '', '']);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [dnaData, setDnaData] = useState<MusicalDnaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const genres = [
    'Rock', 'Pop', 'Classical', 'Jazz', 'Electronic', 
    'Hip-Hop', 'Metal', 'Folk', 'R&B', 'Country'
  ];

  const handleGenerate = async () => {
    if (!name.trim() || songs.filter(s => s.trim()).length === 0) {
      setError('Please enter your name and at least one favorite song!');
      return;
    }

    setIsGenerating(true);
    setStep('generating');
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/generate-musical-dna', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          favorite_songs: songs.filter(s => s.trim()),
          selected_genres: selectedGenres.map(i => genres[i]),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Musical DNA');
      }

      const result = await response.json();
      setDnaData({
        ...result.dna_data,
        files: result.files || {}
      });
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStep('input');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGenre = (index: number) => {
    setSelectedGenres(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getIntervalName = (ratio: number): string => {
    const rounded = Math.round(ratio * 1000);
    switch (rounded) {
      case 1500: return 'Perfect Fifth';
      case 1333: return 'Perfect Fourth';
      case 2000: return 'Octave';
      case 1667: return 'Major Sixth';
      case 1250: return 'Major Third';
      default: return 'Custom Interval';
    }
  };

  const renderInputStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-blue-600">🧬 Musical DNA Generator</h2>
        <p className="text-sm text-gray-600 mt-2">Discover your unique musical fingerprint!</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold mb-2">👤 Your Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-95 w-full text-sm px-2 py-1"
          placeholder="Enter your name..."
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">🎵 Favorite Songs (up to 3):</label>
        {songs.map((song, index) => (
          <input
            key={index}
            type="text"
            value={song}
            onChange={(e) => {
              const newSongs = [...songs];
              newSongs[index] = e.target.value;
              setSongs(newSongs);
            }}
            className="input-95 w-full text-sm px-2 py-1 mb-2"
            placeholder={`Song ${index + 1}...`}
          />
        ))}
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">🎸 Musical Genres:</label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {genres.map((genre, index) => (
            <label key={index} className="flex items-center space-x-2 cursor-pointer p-1">
              <input
                type="checkbox"
                checked={selectedGenres.includes(index)}
                onChange={() => toggleGenre(index)}
                className="form-checkbox h-4 w-4"
              />
              <span className="select-none">{genre}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="button-95 w-full text-sm font-bold bg-blue-500 text-white py-2 px-4"
      >
        {isGenerating ? '🧪 Generating...' : '🧬 Generate My Musical DNA!'}
      </button>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="text-center space-y-6 py-4">
      <div className="text-6xl animate-spin">🧬</div>
      <h2 className="text-xl font-bold text-blue-600">Generating Your Musical DNA...</h2>
      <div className="space-y-3 text-sm text-gray-600">
        <p>🔬 Analyzing musical preferences...</p>
        <p>🎵 Processing harmonic patterns...</p>
        <p>🔐 Creating Zero-Knowledge proof...</p>
        <p>✨ Finalizing your unique fingerprint...</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-blue-600 h-3 rounded-full animate-pulse" style={{width: '75%'}}></div>
      </div>
    </div>
  );

  const renderResultStep = () => {
    if (!dnaData) return null;

    return (
      <div className="space-y-4">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-blue-600">🎉 Your Musical DNA!</h2>
          <div 
            className="text-lg font-mono font-bold px-4 py-2 rounded-lg inline-block text-white shadow-lg"
            style={{ backgroundColor: dnaData.synesthetic_color }}
          >
            {dnaData.fingerprint}
          </div>
        </div>

        <div className="bg-black p-4 rounded-lg border-2 border-gray-400 text-green-400 font-mono text-sm">
          <div className="mb-3">
            <span className="text-cyan-400 font-bold">🎨 Color:</span> 
            <span className="ml-2">{dnaData.synesthetic_color}</span>
          </div>
          <div className="mb-3">
            <span className="text-cyan-400 font-bold">📊 Complexity:</span> 
            <span className="ml-2 text-yellow-400 font-bold">{dnaData.harmonic_complexity}%</span>
          </div>
          
          <div className="mb-3">
            <span className="text-cyan-400 font-bold">🎵 Top Intervals:</span>
            {dnaData.interval_preferences?.slice(0, 3).map(([interval, preference], idx) => (
              <div key={idx} className="ml-3 mt-1">
                <span className="text-white">{getIntervalName(interval.ratio)}:</span> 
                <span className="ml-2 text-green-300">{'█'.repeat(Math.floor(preference * 10))}</span>
                <span className="ml-2 text-yellow-400">{Math.floor(preference * 100)}%</span>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <span className="text-cyan-400 font-bold">🥁 Rhythm:</span>
            <div className="ml-3 mt-1 text-lg">
              {dnaData.rhythm_signature?.map((val, idx) => {
                const height = Math.floor(val * 5);
                const chars = ['▁', '▂', '▃', '▄', '▅', '█'];
                return chars[height] || '▁';
              }).join('')}
            </div>
          </div>

          <div>
            <span className="text-cyan-400 font-bold">🎹 Tonal Centers:</span> 
            <span className="ml-2 text-purple-400 font-bold">{dnaData.tonal_centers?.join(' → ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(dnaData.fingerprint);
              alert('Musical DNA copied to clipboard! 🧬');
            }}
            className="button-95 text-sm font-bold bg-green-500 text-white py-2 px-3"
          >
            📋 Copy DNA
          </button>
          <button
            onClick={() => {
              setStep('input');
              setDnaData(null);
              setName('');
              setSongs(['', '', '']);
              setSelectedGenres([]);
            }}
            className="button-95 text-sm font-bold bg-blue-500 text-white py-2 px-3"
          >
            🔄 Generate New
          </button>
        </div>

        {/* Download Files Section */}
        {dnaData.files && (
          <div className="border-t pt-4">
            <h3 className="text-md font-bold text-gray-700 mb-3 text-center">📁 Download Files</h3>
            <div className="grid grid-cols-1 gap-2">
              {dnaData.files.json_filename && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `http://localhost:8080/download-musical-dna-json/${dnaData.files!.json_filename}`;
                    link.download = dnaData.files!.json_filename!;
                    link.click();
                  }}
                  className="button-95 text-sm font-bold bg-purple-500 text-white py-2 px-3 w-full"
                >
                  📄 Download JSON ({dnaData.files.json_filename})
                </button>
              )}
              
              {dnaData.files.zkp_filename && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `http://localhost:8080/download-musical-dna-zkp/${dnaData.files!.zkp_filename}`;
                    link.download = dnaData.files!.zkp_filename!;
                    link.click();
                  }}
                  className="button-95 text-sm font-bold bg-orange-500 text-white py-2 px-3 w-full"
                >
                  🔐 Download ZK Proof ({Math.round((dnaData.files.zkp_size || 0) / 1024)}KB)
                </button>
              )}
              
              {!dnaData.files.zkp_filename && (
                <div className="text-xs text-gray-500 text-center p-2 bg-gray-100 rounded">
                  ⚠️ ZK Proof file not available
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 text-center space-y-2">
          <p>🎊 Share your Musical DNA on social media!</p>
          <p>🤝 Compare with friends to find compatibility!</p>
          <p>🔐 Your DNA is cryptographically verified!</p>
        </div>
      </div>
    );
  };

  return (
    <FloatingWindow
      title="🧬 Musical DNA Lab"
      onClose={onClose}
      icon="/musical-dna-icon.svg"
      initialWidth={520}
      initialHeight={700}
    >
      <div className="p-4 h-full overflow-auto musical-dna-text">
        {step === 'input' && renderInputStep()}
        {step === 'generating' && renderGeneratingStep()}
        {step === 'result' && renderResultStep()}
      </div>
    </FloatingWindow>
  );
};

export default MusicalDnaWindow;