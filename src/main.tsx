import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeAnalytics } from './lib/analytics';

// Initialize Google Analytics
initializeAnalytics();

// Disable StrictMode in development due to react-beautiful-dnd compatibility issues
const isDevelopment = import.meta.env.DEV;

createRoot(document.getElementById('root')!).render(
  isDevelopment ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  )
);
