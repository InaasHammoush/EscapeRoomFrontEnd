import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GameModeProvider } from "./state/gameMode.jsx";
import ErrorBoundary from "./components/dev/ErrorBoundary";
import './index.css'
import App from './App.jsx'
import { SessionProvider } from "./state/session";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
        <ErrorBoundary>
            <SessionProvider>
                <GameModeProvider>
                    <App />
                </GameModeProvider>
            </SessionProvider>
        </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
