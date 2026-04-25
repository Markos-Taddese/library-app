import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { AuthProvider} from './context/authContext';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <DarkModeProvider>
          <BrowserRouter>
          <App />
          </BrowserRouter>
        </DarkModeProvider>
      </ToastProvider>
    </AuthProvider>
    
  </StrictMode>,
)