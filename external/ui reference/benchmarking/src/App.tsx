import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './screens/MainScreen';
import BenchmarkScreen from './screens/BenchmarkScreen';
import CatalogScreen from './screens/CatalogScreen';
import ReportsScreen from './screens/ReportsScreen';
import DoomScreen from './screens/DoomScreen';
import { SoundProvider } from './contexts/SoundContext';
import { RetroProvider } from './contexts/RetroContext';
import { DisplayProvider } from './contexts/DisplayContext';
import { GameDataProvider } from './contexts/GameDataContext';

function App() {
  return (
    <GameDataProvider>
      <DisplayProvider>
    <RetroProvider>
      <SoundProvider>
        <div className="app-container">
          <div className="crt-effect">
            <Router>
              <Routes>
                <Route path="/" element={<MainScreen />} />
                <Route path="/benchmark" element={<BenchmarkScreen />} />
                <Route path="/catalog" element={<CatalogScreen />} />
                <Route path="/reports" element={<ReportsScreen />} />
                <Route path="/doom" element={<DoomScreen onBack={() => window.history.back()} />} />
              </Routes>
            </Router>
          </div>
        </div>
      </SoundProvider>
    </RetroProvider>
      </DisplayProvider>
    </GameDataProvider>
  );
}

export default App;