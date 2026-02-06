import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext';
import { DarkModeProvider } from './context/DarkModeContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
        <DarkModeProvider>
          <BrowserRouter>
          <App />
          </BrowserRouter>
        </DarkModeProvider>
      </ToastProvider>
  </StrictMode>,
)