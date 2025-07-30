import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface GameRequirements {
  gpu: string;
  cpu: string;
  ram: string;
  score: number;
}

export interface Game {
  id: number;
  title: string;
  platform: string;
  size: string;
  year: number;
  requirements: {
    minimum: GameRequirements;
    recommended: GameRequirements;
  };
}

export interface BenchmarkResult {
  level: string;
  fps: number;
  gpuUsage: number;
  cpuUsage: number;
  temperature: number;
  frameTime: number;
  score: number;
}

export interface BenchmarkReport {
  id: string;
  gameName: string;
  date: string;
  duration: number;
  results: BenchmarkResult[];
  averageFps: number;
  maxTemp: number;
  bottlenecks: string[];
  recommendation: string;
}

interface GameDataContextType {
  games: Game[];
  benchmarkReports: BenchmarkReport[];
  addBenchmarkReport: (report: BenchmarkReport) => void;
  getBenchmarkHistory: (gameId: number) => BenchmarkReport[];
  getGameById: (id: number) => Game | undefined;
  searchGames: (query: string) => Game[];
  clearReports: () => void;
}

// Real game data - no mocks
const GAMES_DATABASE: Game[] = [
  {
    id: 1,
    title: 'Cyberpunk 2077',
    platform: 'Steam',
    size: '70GB',
    year: 2020,
    requirements: {
      minimum: {
        gpu: 'NVIDIA GeForce GTX 970 / AMD Radeon RX 470',
        cpu: 'Intel Core i5-3570K / AMD FX-8310',
        ram: '8GB',
        score: 15000
      },
      recommended: {
        gpu: 'NVIDIA GeForce RTX 2060 / AMD Radeon RX 5700 XT',
        cpu: 'Intel Core i7-4790 / AMD Ryzen 3 3200G',
        ram: '12GB',
        score: 30000
      }
    }
  },
  {
    id: 2,
    title: 'Red Dead Redemption 2',
    platform: 'Epic Games',
    size: '150GB',
    year: 2019,
    requirements: {
      minimum: {
        gpu: 'NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 480 4GB',
        cpu: 'Intel Core i5-2500K / AMD FX-6300',
        ram: '8GB',
        score: 20000
      },
      recommended: {
        gpu: 'NVIDIA GeForce GTX 1070 / AMD Radeon RX Vega 56',
        cpu: 'Intel Core i7-4770K / AMD Ryzen 5 1500X',
        ram: '12GB',
        score: 35000
      }
    }
  },
  {
    id: 3,
    title: 'Call of Duty: Modern Warfare II',
    platform: 'Battle.net',
    size: '125GB',
    year: 2022,
    requirements: {
      minimum: {
        gpu: 'NVIDIA GeForce GTX 1650 / AMD Radeon RX 5500 XT',
        cpu: 'Intel Core i5-6600K / AMD Ryzen 5 1400',
        ram: '8GB',
        score: 25000
      },
      recommended: {
        gpu: 'NVIDIA GeForce RTX 3060 / AMD Radeon RX 6600 XT',
        cpu: 'Intel Core i7-8700K / AMD Ryzen 7 2700X',
        ram: '16GB',
        score: 40000
      }
    }
  },
  {
    id: 4,
    title: 'Elden Ring',
    platform: 'Steam',
    size: '60GB',
    year: 2022,
    requirements: {
      minimum: {
        gpu: 'NVIDIA GeForce GTX 1060 3GB / AMD Radeon RX 580 4GB',
        cpu: 'Intel Core i5-8400 / AMD Ryzen 3 3300X',
        ram: '12GB',
        score: 22000
      },
      recommended: {
        gpu: 'NVIDIA GeForce GTX 1070 / AMD Radeon RX Vega 56',
        cpu: 'Intel Core i7-8700K / AMD Ryzen 5 3600X',
        ram: '16GB',
        score: 38000
      }
    }
  },
  {
    id: 5,
    title: 'God of War',
    platform: 'Epic Games',
    size: '70GB',
    year: 2022,
    requirements: {
      minimum: {
        gpu: 'NVIDIA GeForce GTX 960 4GB / AMD Radeon R9 290X',
        cpu: 'Intel Core i5-2500K / AMD Ryzen 3 1200',
        ram: '8GB',
        score: 18000
      },
      recommended: {
        gpu: 'NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 570 4GB',
        cpu: 'Intel Core i5-6600K / AMD Ryzen 5 2400G',
        ram: '8GB',
        score: 32000
      }
    }
  },
  {
    id: 6,
    title: 'Hogwarts Legacy',
    platform: 'Steam',
    size: '85GB',
    year: 2023,
    requirements: {
      minimum: {
        gpu: 'NVIDIA GeForce GTX 960 / AMD Radeon RX 470',
        cpu: 'Intel Core i5-6600 / AMD Ryzen 5 1400',
        ram: '16GB',
        score: 20000
      },
      recommended: {
        gpu: 'NVIDIA GeForce RTX 2070 / AMD Radeon RX 6700 XT',
        cpu: 'Intel Core i7-8700 / AMD Ryzen 5 3600',
        ram: '16GB',
        score: 42000
      }
    }
  },
  {
    id: 7,
    title: 'Starfield',
    platform: 'Steam',
    size: '125GB',
    year: 2023,
    requirements: {
      minimum: {
        gpu: 'NVIDIA GeForce GTX 1070 Ti / AMD Radeon RX 5700',
        cpu: 'Intel Core i7-6800K / AMD Ryzen 5 2600X',
        ram: '16GB',
        score: 28000
      },
      recommended: {
        gpu: 'NVIDIA GeForce RTX 2080 / AMD Radeon RX 6800 XT',
        cpu: 'Intel Core i5-10600K / AMD Ryzen 5 3600X',
        ram: '16GB',
        score: 45000
      }
    }
  }
];

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

export const useGameData = () => {
  const context = useContext(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
};

interface GameDataProviderProps {
  children: ReactNode;
}

export const GameDataProvider: React.FC<GameDataProviderProps> = ({ children }) => {
  const [games] = useState<Game[]>(GAMES_DATABASE);
  const [benchmarkReports, setBenchmarkReports] = useState<BenchmarkReport[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('retro-bench-reports');
    return saved ? JSON.parse(saved) : [];
  });

  const addBenchmarkReport = (report: BenchmarkReport) => {
    setBenchmarkReports(prev => {
      const updated = [report, ...prev];
      localStorage.setItem('retro-bench-reports', JSON.stringify(updated));
      return updated;
    });
  };

  const clearReports = () => {
    setBenchmarkReports([]);
    localStorage.removeItem('retro-bench-reports');
  };

  const getBenchmarkHistory = (gameId: number) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return [];
    
    return benchmarkReports.filter(report => 
      report.gameName.toLowerCase() === game.title.toLowerCase()
    );
  };

  const getGameById = (id: number) => {
    return games.find(game => game.id === id);
  };

  const searchGames = (query: string) => {
    if (!query.trim()) return games;
    
    const lowercaseQuery = query.toLowerCase();
    return games.filter(game => 
      game.title.toLowerCase().includes(lowercaseQuery) ||
      game.platform.toLowerCase().includes(lowercaseQuery) ||
      game.year.toString().includes(query)
    );
  };

  return (
    <GameDataContext.Provider
      value={{
        games,
        benchmarkReports,
        addBenchmarkReport,
        getBenchmarkHistory,
        getGameById,
        searchGames,
        clearReports,
      }}
    >
      {children}
    </GameDataContext.Provider>
  );
}; 