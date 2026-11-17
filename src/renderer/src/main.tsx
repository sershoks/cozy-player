import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import MiniPlayerApp from './MiniPlayerApp'
import './styles/theme.css'
import './styles/app.css'

const isMiniPlayer = new URLSearchParams(window.location.search).get('mode') === 'mini'
if (isMiniPlayer) document.body.classList.add('mini-player-mode')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isMiniPlayer ? (
      <MiniPlayerApp />
    ) : (
      <HashRouter>
        <App />
      </HashRouter>
    )}
  </React.StrictMode>
)
