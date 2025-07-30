// Browser-compatible Tor and Mullvad manager using backend API
export interface TorStatus {
  running: boolean;
  pid: number | null;
  onionAddress: string | null;
}

export interface MullvadStatus {
  connected: boolean;
  location: string | null;
  ip: string | null;
}

export interface MullvadLocation {
  code: string;
  name: string;
}

class TorMullvadManager {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private statusCallbacks: Set<(tor: TorStatus, mullvad: MullvadStatus) => void> = new Set();

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.initWebSocket();
  }

  private initWebSocket() {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws');
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected to backend');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status_update') {
            this.statusCallbacks.forEach(callback => {
              callback(data.tor, data.mullvad);
            });
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setTimeout(() => this.initWebSocket(), 5000);
      };

      this.ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  // Subscribe to real-time status updates
  onStatusUpdate(callback: (tor: TorStatus, mullvad: MullvadStatus) => void) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // TOR METHODS
  async startTor(): Promise<{ success: boolean; message: string; pid?: number }> {
    try {
      const result = await this.apiCall('/api/tor/start', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to start Tor: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async stopTor(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.apiCall('/api/tor/stop', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop Tor: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getTorStatus(): Promise<TorStatus> {
    try {
      const result = await this.apiCall('/api/tor/status');
      return result.status;
    } catch (error) {
      console.error('Failed to get Tor status:', error);
      return { running: false, pid: null, onionAddress: null };
    }
  }

  // MULLVAD METHODS
  async connectMullvad(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.apiCall('/api/mullvad/connect', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect Mullvad: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async disconnectMullvad(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.apiCall('/api/mullvad/disconnect', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to disconnect Mullvad: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async setMullvadLocation(location: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.apiCall('/api/mullvad/set-location', {
        method: 'POST',
        body: JSON.stringify({ location }),
      });
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to set Mullvad location: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getMullvadStatus(): Promise<MullvadStatus> {
    try {
      const result = await this.apiCall('/api/mullvad/status');
      return result.status;
    } catch (error) {
      console.error('Failed to get Mullvad status:', error);
      return { connected: false, location: null, ip: null };
    }
  }

  async getMullvadLocations(): Promise<MullvadLocation[]> {
    try {
      const result = await this.apiCall('/api/mullvad/locations');
      return result.locations || [];
    } catch (error) {
      console.error('Failed to get Mullvad locations:', error);
      return [];
    }
  }

  // COMBINED METHODS
  async startFullTunnel(): Promise<{ success: boolean; message: string }> {
    try {
      // First connect Mullvad
      const mullvadResult = await this.connectMullvad();
      if (!mullvadResult.success) {
        return mullvadResult;
      }

      // Wait a moment for Mullvad to establish connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Then start Tor
      const torResult = await this.startTor();
      if (!torResult.success) {
        return {
          success: false,
          message: `Mullvad connected but Tor failed: ${torResult.message}`,
        };
      }

      return {
        success: true,
        message: 'Full tunnel (Mullvad + Tor) started successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to start full tunnel: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async stopFullTunnel(): Promise<{ success: boolean; message: string }> {
    try {
      // Stop Tor first
      const torResult = await this.stopTor();
      
      // Then disconnect Mullvad
      const mullvadResult = await this.disconnectMullvad();

      if (torResult.success && mullvadResult.success) {
        return {
          success: true,
          message: 'Full tunnel stopped successfully',
        };
      } else {
        return {
          success: false,
          message: `Partial failure - Tor: ${torResult.message}, Mullvad: ${mullvadResult.message}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop full tunnel: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // NETWORK TESTING METHODS
  async testTorConnection(): Promise<{ success: boolean; torEnabled: boolean; ip?: string; message?: string }> {
    try {
      const result = await this.apiCall('/api/network/test-tor');
      return result;
    } catch (error) {
      return {
        success: false,
        torEnabled: false,
        message: `Failed to test Tor connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async testMullvadConnection(): Promise<{ success: boolean; mullvadEnabled: boolean; ip?: string; country?: string; message?: string }> {
    try {
      const result = await this.apiCall('/api/network/test-mullvad');
      return result;
    } catch (error) {
      return {
        success: false,
        mullvadEnabled: false,
        message: `Failed to test Mullvad connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Get combined status
  async getStatus(): Promise<{ tor: TorStatus; mullvad: MullvadStatus; timestamp: string }> {
    try {
      const result = await this.apiCall('/api/status');
      return result;
    } catch (error) {
      console.error('Failed to get combined status:', error);
      return {
        tor: { running: false, pid: null, onionAddress: null },
        mullvad: { connected: false, location: null, ip: null },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Cleanup method
  destroy() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.statusCallbacks.clear();
  }
}

// Export singleton instance
export const torMullvadManager = new TorMullvadManager();
export default TorMullvadManager; 