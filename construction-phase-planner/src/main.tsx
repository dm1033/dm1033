import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { GameProvider } from './state/GameContext'
import './index.css'

// Offline support: cache the app shell after first load (production only).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline mode unavailable */ })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
)
