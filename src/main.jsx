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
  // StrictMode disabled - causes double-invocation of state updaters in dev mode
  // which breaks window maximize/minimize logic. Can be re-enabled after refactoring
  // to use useReducer or making the logic more idempotent.
  <ErrorBoundary context="Root" message="Metro OS failed to load. Please refresh the page.">
    <SettingsProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </SettingsProvider>
  </ErrorBoundary>,
)
