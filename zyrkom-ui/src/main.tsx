import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './matrix-global.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="matrix-container">
      <App />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#001100',
            color: '#00ff00',
            border: '1px solid #00ff00',
            fontFamily: 'monospace',
          },
        }}
      />
    </div>
  </React.StrictMode>,
) 