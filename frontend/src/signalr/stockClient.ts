import * as signalR from '@microsoft/signalr';

// Get the base URL for SignalR hub
const getSignalRUrl = () => {
  if (typeof window !== 'undefined') {
    // Use current origin for browser environment
    const baseUrl = window.location.origin;
    return `${baseUrl}/hubs/stock`;
  }
  // Fallback for non-browser environments
  return '/hubs/stock';
};

const connection = new signalR.HubConnectionBuilder()
  .withUrl(getSignalRUrl(), {
    skipNegotiation: false,
    transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
  })
  .withAutomaticReconnect()
  .configureLogging(signalR.LogLevel.Information)
  .build();

export function startStockConnection(onStockChanged: (payload: { productId: number; availableStock: number }) => void) {
  connection.on('StockChanged', (payload: any) => {
    try {
      onStockChanged(payload);
    } catch (e) {
      console.error('Error handling stock change', e);
    }
  });

  return connection.start().catch(err => {
    console.error('Failed to start SignalR connection:', err);
  });
}

export function stopStockConnection() {
  return connection.stop();
}
