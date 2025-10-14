import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import signalRService from './services/signalrService'

// 🚀 Start SignalR connection for realtime stock updates
signalRService.start().then(() => {
  console.log('🎯 [Main] SignalR service started for realtime stock updates');
}).catch((error) => {
  console.error('❌ [Main] Failed to start SignalR service:', error);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  signalRService.stop();
});

// Optional: Clean up on page visibility change (when user switches tabs)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Could pause connection or reduce polling if needed
  } else {
    // Resume if needed
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
