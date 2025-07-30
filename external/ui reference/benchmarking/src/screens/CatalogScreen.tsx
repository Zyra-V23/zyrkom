import React, { useState } from 'react';
import RetroMenu from '../components/RetroMenu';
import RetroWindow from '../components/RetroWindow';
import RetroButton from '../components/RetroButton';
import RetroList from '../components/RetroList';
import { useNavigate } from 'react-router-dom';
import { useGameData } from '../contexts/GameDataContext';
import { useSound } from '../contexts/SoundContext';

const menuItems = [
  { label: 'GAME', key: 'GAME', path: '/' },
  { label: 'CONFIG', key: 'CONFIG', path: '/settings' },
  { label: 'BENCH', key: 'BENCH', path: '/benchmark' },
  { label: 'MISC', key: 'MISC', path: '/reports' }
];

enum PlatformFilter {
  ALL = 'ALL',
  STEAM = 'Steam',
  EPIC = 'Epic Games',
  BATTLE_NET = 'Battle.net',
  OTHER = 'Other'
}

const CatalogScreen: React.FC = () => {
  const navigate = useNavigate();
  const { playMenuSelect } = useSound();
  const { games, searchGames } = useGameData();
  const [filter, setFilter] = useState<PlatformFilter>(PlatformFilter.ALL);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = React.useMemo(() => {
    let result = searchQuery ? searchGames(searchQuery) : games;
    
    // Apply platform filter
    if (filter !== PlatformFilter.ALL) {
      result = result.filter(game => {
      if (filter === PlatformFilter.OTHER) {
        // "Other" shows everything except Steam, Epic, and Battle.net
          return !['Steam', 'Epic Games', 'Battle.net'].includes(game.platform);
        } else {
          return game.platform === filter;
        }
      });
    }
    
    return result;
  }, [games, searchGames, filter, searchQuery]);

  const handleGameSelect = (game: any) => {
    setSelectedGame(game);
    playMenuSelect();
  };

  const handleBenchmarkGame = () => {
    if (selectedGame) {
      navigate('/benchmark');
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#00ff00] font-mono">
      <RetroMenu 
        items={menuItems} 
        onMenuClick={(item) => {
          if (item.path) {
            navigate(item.path);
          }
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">GAME CATALOG</h1>
          <div className="text-[#00ff00]">BROWSE AND ANALYZE GAME REQUIREMENTS</div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="lg:col-span-2">
            <RetroWindow title="AVAILABLE GAMES" className="h-[60vh]">
              <div className="p-4">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="SEARCH GAMES..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black border border-[#00ff00] text-[#00ff00] p-2 font-mono"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <RetroButton 
                    onClick={() => setFilter(PlatformFilter.ALL)}
                    className={`text-xs px-3 py-1 ${filter === PlatformFilter.ALL ? 'bg-[#00ff00] text-black' : ''}`}
                  >
                    ALL
                  </RetroButton>
                  <RetroButton 
                    onClick={() => setFilter(PlatformFilter.STEAM)}
                    className={`text-xs px-3 py-1 ${filter === PlatformFilter.STEAM ? 'bg-[#00ff00] text-black' : ''}`}
                  >
                    STEAM
                  </RetroButton>
                  <RetroButton 
                    onClick={() => setFilter(PlatformFilter.EPIC)}
                    className={`text-xs px-3 py-1 ${filter === PlatformFilter.EPIC ? 'bg-[#00ff00] text-black' : ''}`}
                  >
                    EPIC
                  </RetroButton>
                  <RetroButton 
                    onClick={() => setFilter(PlatformFilter.BATTLE_NET)}
                    className={`text-xs px-3 py-1 ${filter === PlatformFilter.BATTLE_NET ? 'bg-[#00ff00] text-black' : ''}`}
                  >
                    BATTLE.NET
                  </RetroButton>
                  <RetroButton 
                    onClick={() => setFilter(PlatformFilter.OTHER)}
                    className={`text-xs px-3 py-1 ${filter === PlatformFilter.OTHER ? 'bg-[#00ff00] text-black' : ''}`}
                  >
                    OTHER
                  </RetroButton>
                </div>

                <div className="overflow-y-auto max-h-[40vh]">
                <RetroList
                  items={filteredGames}
                  keyExtractor={(item) => item.id.toString()}
                  onSelect={handleGameSelect}
                  renderItem={(item, isSelected) => (
                      <div className="flex justify-between items-center py-1">
                        <span className={isSelected ? 'text-black bg-[#00ff00] px-1' : ''}>
                          {item.title} ({item.year})
                        </span>
                        <span className="text-sm">{item.platform}</span>
                    </div>
                  )}
                />
                </div>
              </div>
            </RetroWindow>
          </div>
          
          <div>
            <RetroWindow title="GAME DETAILS" className="h-[60vh]">
              {selectedGame ? (
                <div className="p-4 overflow-y-auto">
                  <div className="text-center mb-4 text-[#00ff00] text-lg font-bold">
                    {selectedGame.title}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>PLATFORM:</span>
                      <span className="text-[#ffff00]">{selectedGame.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SIZE:</span>
                      <span className="text-[#ffff00]">{selectedGame.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>YEAR:</span>
                      <span className="text-[#ffff00]">{selectedGame.year}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-[#00ff00] mb-2 font-bold">MINIMUM REQUIREMENTS:</div>
                    <div className="text-sm space-y-1 pl-2">
                      <div>GPU: {selectedGame.requirements.minimum.gpu}</div>
                      <div>CPU: {selectedGame.requirements.minimum.cpu}</div>
                      <div>RAM: {selectedGame.requirements.minimum.ram}</div>
                      <div>SCORE: {selectedGame.requirements.minimum.score}</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-[#00ff00] mb-2 font-bold">RECOMMENDED:</div>
                    <div className="text-sm space-y-1 pl-2">
                      <div>GPU: {selectedGame.requirements.recommended.gpu}</div>
                      <div>CPU: {selectedGame.requirements.recommended.cpu}</div>
                      <div>RAM: {selectedGame.requirements.recommended.ram}</div>
                      <div>SCORE: {selectedGame.requirements.recommended.score}</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <RetroButton onClick={handleBenchmarkGame}>
                      BENCHMARK THIS GAME
                    </RetroButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-[#666666]">
                  SELECT A GAME<br />TO VIEW DETAILS
                </div>
              )}
            </RetroWindow>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <RetroButton onClick={() => navigate('/')}>
            BACK TO MAIN
          </RetroButton>
        </div>
      </div>
      
      <div className="text-center text-xs text-[#666666] py-2">
        {filteredGames.length} GAMES AVAILABLE • USE ARROW KEYS TO NAVIGATE
      </div>
    </div>
  );
};

export default CatalogScreen;