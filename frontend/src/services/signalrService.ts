import * as signalR from '@microsoft/signalr';
import { ProductService } from './productService';

interface StockUpdateData {
  productId: number;
  availableStock: number;
  productName: string;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.setupConnection();
  }

  private setupConnection(): void {
    // Use environment variable or fallback to local development URL
    const hubUrl = import.meta.env.VITE_SIGNALR_HUB_URL || 
                   `${import.meta.env.VITE_API_BASE_URL || 'https://api.greenweave.vn'}/hubs/stock`;

    console.log('🔧 [SignalR] Connecting to:', hubUrl);

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        withCredentials: false
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount < 3) return 1000;
          if (retryContext.previousRetryCount < 5) return 3000;
          return 5000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle stock change events
    this.connection.on('StockChanged', (data: StockUpdateData) => {
      console.log('📦 [SignalR] Stock changed:', data);
      
      // Update cached products with new stock
      ProductService.refreshProduct(data.productId, data.availableStock);
      
      // Dispatch global event for UI components
      window.dispatchEvent(new CustomEvent('stock:changed', {
        detail: {
          productId: data.productId,
          availableStock: data.availableStock,
          productName: data.productName
        }
      }));
      
      console.log('📤 [SignalR] Dispatched stock:changed event for product', data.productId);
      
      // Show notification to user
      this.showStockNotification(data);
    });

    // Connection state events
    this.connection.onreconnecting(() => {
      console.log('🔄 [SignalR] Reconnecting...');
    });

    this.connection.onreconnected(() => {
      console.log('✅ [SignalR] Reconnected successfully');
      this.reconnectAttempts = 0;
    });

    this.connection.onclose((error) => {
      console.error('❌ [SignalR] Connection closed:', error);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.start(), 5000);
      }
    });
  }

  private showStockNotification(data: StockUpdateData): void {
    // Create a subtle notification for stock changes
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-sm font-medium">
          ${data.productName}: còn ${data.availableStock} sản phẩm
        </span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  async start(): Promise<void> {
    if (this.isConnecting || !this.connection) return;
    
    try {
      this.isConnecting = true;
      await this.connection.start();
      console.log('🚀 [SignalR] Connected successfully');
    } catch (error) {
      console.error('❌ [SignalR] Connection failed:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.start(), 5000);
      }
    } finally {
      this.isConnecting = false;
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      console.log('🛑 [SignalR] Connection stopped');
    }
  }

  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Create singleton instance
const signalRService = new SignalRService();

export default signalRService;
export { type StockUpdateData };