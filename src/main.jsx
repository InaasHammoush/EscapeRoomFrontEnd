import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GameModeProvider } from "./state/gameMode.jsx";
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
        <GameModeProvider>
            <App />
        </GameModeProvider>
    </BrowserRouter>
  </StrictMode>,
)
