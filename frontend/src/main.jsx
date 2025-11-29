import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext';
import { DarkModeProvider } from './context/DarkModeContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DarkModeProvider>
          <App />
        </DarkModeProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)