import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import './index.css';
import App from './App';
import { StoreProvider, useStore } from './store';
import { ToastProvider } from './components/Toast';

const AppWithProviders = () => {
  const { state } = useStore();
  return (
    <ToastProvider lang={state.lang}>
      <App />
    </ToastProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <AppWithProviders />
      </StoreProvider>
    </MotionConfig>
  </StrictMode>
);
