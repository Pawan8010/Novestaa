import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Maps Platform Tier 1 global auth/quota fallback listener
(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-map-fallback'));
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  } else if (
    msg.includes('ApiNotActivatedMapError') ||
    msg.includes('InvalidKeyMapError') ||
    msg.includes('RefererNotAllowedMapError') ||
    msg.includes('BillingNotEnabledMapError') ||
    msg.includes('ApiProjectMapError')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-map-fallback'));
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
