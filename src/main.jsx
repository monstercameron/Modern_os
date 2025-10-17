import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import { SettingsProvider } from './hooks/useSettings.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { setupGlobalErrorHandler } from './utils/errorHandler.js'

// Initialize global error handler
setupGlobalErrorHandler();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary context="Root" message="Metro OS failed to load. Please refresh the page.">
      <SettingsProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
