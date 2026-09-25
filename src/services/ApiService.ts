// REST API Client for Raspberry Pi 3 Autonomous Mobile Robot Backend

export class RobotApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.warn(`[RobotApiService] Request to ${url} failed:`, err.message);
      throw err;
    }
  }

  // Navigation Endpoints
  async setDestination(x: number, y: number): Promise<{ success: boolean; message: string }> {
    return this.request('/api/navigation/destination', {
      method: 'POST',
      body: JSON.stringify({ x, y }),
    });
  }

  async startNavigation(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/navigation/start', { method: 'POST' });
  }

  async pauseNavigation(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/navigation/pause', { method: 'POST' });
  }

  async cancelNavigation(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/navigation/cancel', { method: 'POST' });
  }

  async returnToStart(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/navigation/return-to-start', { method: 'POST' });
  }

  // Robot Safety & Stop
  async emergencyStop(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/robot/stop', { method: 'POST' });
  }

  async resumeRobot(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/robot/resume', { method: 'POST' });
  }

  // Manual Control
  async manualMove(
    direction: 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'STOP',
    speed: number
  ): Promise<{ success: boolean; message: string }> {
    return this.request('/api/manual/move', {
      method: 'POST',
      body: JSON.stringify({ direction, speed }),
    });
  }

  // Settings
  async setSafetyDistance(cm: number): Promise<{ success: boolean; message: string }> {
    return this.request('/api/safety/distance', {
      method: 'POST',
      body: JSON.stringify({ safetyDistanceCm: cm }),
    });
  }

  // Telemetry & Status
  async getStatus(): Promise<any> {
    return this.request('/api/robot/status');
  }

  async getMap(): Promise<any> {
    return this.request('/api/map');
  }

  async getTelemetry(): Promise<any> {
    return this.request('/api/telemetry');
  }
}

export const apiService = new RobotApiService();
