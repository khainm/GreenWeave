import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl('/hubs/stock')
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
