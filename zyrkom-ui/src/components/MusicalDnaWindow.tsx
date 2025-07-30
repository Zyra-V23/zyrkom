import React, { useState, useRef, useEffect } from 'react';
import FloatingWindow from './FloatingWindow';

interface MusicalDnaData {
  fingerprint: string;
  synesthetic_color: string;
  harmonic_complexity: number;
  interval_preferences: Array<[{ ratio: number; cents: number }, number]>;
  rhythm_signature: number[];
  tonal_centers: string[];
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
      setDnaData(result.dna_data);
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
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-blue-600">🧬 Musical DNA Generator</h2>
        <p className="text-xs text-gray-600">Discover your unique musical fingerprint!</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold mb-1">👤 Your Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-95 w-full text-xs"
          placeholder="Enter your name..."
        />
      </div>

      <div>
        <label className="block text-xs font-bold mb-1">🎵 Favorite Songs (up to 3):</label>
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
            className="input-95 w-full text-xs mb-1"
            placeholder={`Song ${index + 1}...`}
          />
        ))}
      </div>

      <div>
        <label className="block text-xs font-bold mb-1">🎸 Musical Genres:</label>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {genres.map((genre, index) => (
            <label key={index} className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedGenres.includes(index)}
                onChange={() => toggleGenre(index)}
                className="form-checkbox h-3 w-3"
              />
              <span>{genre}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="button-95 w-full text-xs font-bold bg-blue-500 text-white"
      >
        {isGenerating ? '🧪 Generating...' : '🧬 Generate My Musical DNA!'}
      </button>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="text-center space-y-4">
      <div className="text-4xl animate-spin">🧬</div>
      <h2 className="text-lg font-bold text-blue-600">Generating Your Musical DNA...</h2>
      <div className="space-y-2 text-xs text-gray-600">
        <p>🔬 Analyzing musical preferences...</p>
        <p>🎵 Processing harmonic patterns...</p>
        <p>🔐 Creating Zero-Knowledge proof...</p>
        <p>✨ Finalizing your unique fingerprint...</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
      </div>
    </div>
  );

  const renderResultStep = () => {
    if (!dnaData) return null;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-blue-600">🎉 Your Musical DNA!</h2>
          <div 
            className="text-xs font-mono font-bold px-2 py-1 rounded inline-block text-white"
            style={{ backgroundColor: dnaData.synesthetic_color }}
          >
            {dnaData.fingerprint}
          </div>
        </div>

        <div className="bg-black p-3 rounded border-2 border-gray-400 text-green-400 font-mono text-xs">
          <div className="mb-2">
            <span className="text-cyan-400">🎨 Color:</span> {dnaData.synesthetic_color}
          </div>
          <div className="mb-2">
            <span className="text-cyan-400">📊 Complexity:</span> {dnaData.harmonic_complexity}%
          </div>
          
          <div className="mb-2">
            <span className="text-cyan-400">🎵 Top Intervals:</span>
            {dnaData.interval_preferences?.slice(0, 3).map(([interval, preference], idx) => (
              <div key={idx} className="ml-2">
                {getIntervalName(interval.ratio)}: {'█'.repeat(Math.floor(preference * 10))} {Math.floor(preference * 100)}%
              </div>
            ))}
          </div>

          <div className="mb-2">
            <span className="text-cyan-400">🥁 Rhythm:</span>
            <div className="ml-2 font-bold">
              {dnaData.rhythm_signature?.map((val, idx) => {
                const height = Math.floor(val * 5);
                const chars = ['▁', '▂', '▃', '▄', '▅', '█'];
                return chars[height] || '▁';
              }).join('')}
            </div>
          </div>

          <div>
            <span className="text-cyan-400">🎹 Tonal Centers:</span> {dnaData.tonal_centers?.join(' → ')}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(dnaData.fingerprint);
              alert('Musical DNA copied to clipboard! 🧬');
            }}
            className="button-95 flex-1 text-xs bg-green-500 text-white"
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
            className="button-95 flex-1 text-xs bg-blue-500 text-white"
          >
            🔄 Generate New
          </button>
        </div>

        <div className="text-xs text-gray-600 text-center space-y-1">
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
      initialWidth={400}
      initialHeight={500}
    >
      <div className="p-4 h-full overflow-auto">
        {step === 'input' && renderInputStep()}
        {step === 'generating' && renderGeneratingStep()}
        {step === 'result' && renderResultStep()}
      </div>
    </FloatingWindow>
  );
};

export default MusicalDnaWindow;