import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startStockConnection, stopStockConnection } from './signalr/stockClient'

// Start SignalR connection and re-dispatch events as a DOM CustomEvent so pages can subscribe
startStockConnection((payload: { productId: number; availableStock: number }) => {
  try {
    window.dispatchEvent(new CustomEvent('stock:changed', { detail: payload }));
  } catch (e) {
    console.error('Failed to dispatch stock:changed event', e);
  }
});

window.addEventListener('beforeunload', () => {
  stopStockConnection().catch(() => {});
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
