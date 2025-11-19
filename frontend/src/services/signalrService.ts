import * as signalR from '@microsoft/signalr';
import { ProductService } from './productService';
import { logger } from '../utils/logger';

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
    // Use environment variable or fallback to API base URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.greenweave.vn';
    const hubUrl = import.meta.env.VITE_SIGNALR_HUB_URL || `${apiBaseUrl}/hubs/stock`;

    logger.debug('🔧 [SignalR] Connecting to:', hubUrl);

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // ✅ Use both WebSockets and LongPolling for reliability
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        // ✅ Skip negotiation in development to avoid CORS preflight issues
        skipNegotiation: false,
        // ✅ Enable credentials for CORS
        withCredentials: false,
        // ✅ Add timeout for long polling
        timeout: 100000,
        // ✅ Add headers if needed
        headers: {}
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
      logger.debug('📦 [SignalR] Stock changed:', data);
      
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
      
      logger.debug('📤 [SignalR] Dispatched stock:changed event for product', data.productId);
      
      // Show notification to user
      this.showStockNotification(data);
    });

    // Connection state events
    this.connection.onreconnecting(() => {
      logger.debug('🔄 [SignalR] Reconnecting...');
    });

    this.connection.onreconnected(() => {
      logger.debug('✅ [SignalR] Reconnected successfully');
      this.reconnectAttempts = 0;
    });

    this.connection.onclose((error) => {
      logger.error('❌ [SignalR] Connection closed:', error);
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
      logger.log('🚀 [SignalR] Connected successfully');
      logger.debug('📡 [SignalR] Connection state:', this.connection.state);
      logger.debug('🔌 [SignalR] Transport:', (this.connection as any).connection?.transport?.name);
      this.reconnectAttempts = 0; // Reset on successful connection
    } catch (error: any) {
      logger.error('❌ [SignalR] Connection failed:', error);
      logger.error('❌ [SignalR] Error details:', {
        message: error?.message,
        statusCode: error?.statusCode,
        type: error?.constructor?.name
      });
      
      this.reconnectAttempts++;
      
      // Stop trying after max attempts and log warning
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.warn('⚠️ [SignalR] Max reconnect attempts reached. Real-time updates disabled.');
        logger.warn('⚠️ [SignalR] The application will continue to work without live stock updates.');
      } else {
        // Retry with exponential backoff
        const delay = Math.min(5000 * this.reconnectAttempts, 30000);
        logger.log(`🔄 [SignalR] Retrying in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.start(), delay);
      }
    } finally {
      this.isConnecting = false;
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      logger.log('🛑 [SignalR] Connection stopped');
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