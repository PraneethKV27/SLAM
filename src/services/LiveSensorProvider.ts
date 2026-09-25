import { ISensorProvider } from './SensorProvider';
import { RobotState, SystemAlert, Destination, OperationMode } from '../types/robot';
import { apiService } from './ApiService';

export class LiveSensorProvider implements ISensorProvider {
  public name = 'Live Hardware Provider (Raspberry Pi 3)';
  public isLive = true;

  private wsUrl: string;
  private ws: WebSocket | null = null;
  private stateSubscribers: Set<(update: Partial<RobotState>) => void> = new Set();
  private alertSubscribers: Set<(alert: SystemAlert) => void> = new Set();
  private reconnectTimer: any = null;
  private isExplicitDisconnect: boolean = false;
  private connected: boolean = false;

  constructor(host: string = window.location.hostname || 'localhost', port: number = 8000) {
    this.wsUrl = `ws://${host}:${port}/ws`;
    apiService.setBaseUrl(`http://${host}:${port}`);
  }

  public setHost(host: string, port: number = 8000) {
    this.wsUrl = `ws://${host}:${port}/ws`;
    apiService.setBaseUrl(`http://${host}:${port}`);
    if (this.connected) {
      this.disconnect();
      this.connect();
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    this.isExplicitDisconnect = false;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.emitAlert({
          id: `live-conn-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          message: 'Connected to Raspberry Pi 3 Hardware WebSocket',
          severity: 'SUCCESS',
        });

        this.notifyState({
          hardware: {
            raspberryPi: 'ONLINE',
            lidar: 'ONLINE',
            camera: 'ONLINE',
            mpu6050: 'ONLINE',
            motorDriver1: 'ONLINE',
            motorDriver2: 'ONLINE',
            wifi: 'CONNECTED',
            backend: 'CONNECTED',
          },
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingMessage(payload);
        } catch (e) {
          console.error('[LiveSensorProvider] Failed to parse WebSocket payload', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[LiveSensorProvider] WebSocket error:', err);
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.notifyState({
          hardware: {
            raspberryPi: 'OFFLINE',
            lidar: 'OFFLINE',
            camera: 'OFFLINE',
            mpu6050: 'OFFLINE',
            motorDriver1: 'OFFLINE',
            motorDriver2: 'OFFLINE',
            wifi: 'DISCONNECTED',
            backend: 'DISCONNECTED',
          },
        });

        if (!this.isExplicitDisconnect) {
          this.emitAlert({
            id: `live-disc-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            message: 'Connection to Raspberry Pi lost. Retrying...',
            severity: 'WARNING',
          });
          // Attempt auto-reconnect after 4 seconds
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(), 4000);
        }
      };
    } catch (err: any) {
      console.warn('[LiveSensorProvider] Error creating WebSocket:', err.message);
      this.connected = false;
    }
  }

  disconnect(): void {
    this.isExplicitDisconnect = true;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  subscribeState(callback: (update: Partial<RobotState>) => void): () => void {
    this.stateSubscribers.add(callback);
    return () => this.stateSubscribers.delete(callback);
  }

  subscribeAlerts(callback: (alert: SystemAlert) => void): () => void {
    this.alertSubscribers.add(callback);
    return () => this.alertSubscribers.delete(callback);
  }

  private notifyState(update: Partial<RobotState>) {
    this.stateSubscribers.forEach((cb) => cb(update));
  }

  private emitAlert(alert: SystemAlert) {
    this.alertSubscribers.forEach((cb) => cb(alert));
  }

  private handleIncomingMessage(data: any) {
    // Expected structure from Raspberry Pi Python Backend:
    // { type: 'TELEMETRY_UPDATE', payload: { position, lidarScan, imu, motors, ... } }
    if (data.type === 'TELEMETRY_UPDATE' && data.payload) {
      this.notifyState(data.payload);
    } else if (data.type === 'ALERT' && data.alert) {
      this.emitAlert(data.alert);
    } else if (data.position || data.lidarScan || data.imu) {
      // Direct state payload
      this.notifyState(data);
    }
  }

  // REST API proxy commands
  async sendDestination(dest: Destination): Promise<boolean> {
    try {
      const res = await apiService.setDestination(dest.x, dest.y);
      return res.success;
    } catch (e) {
      return false;
    }
  }

  async startNavigation(): Promise<boolean> {
    try {
      const res = await apiService.startNavigation();
      return res.success;
    } catch (e) {
      return false;
    }
  }

  async pauseNavigation(): Promise<boolean> {
    try {
      const res = await apiService.pauseNavigation();
      return res.success;
    } catch (e) {
      return false;
    }
  }

  async cancelNavigation(): Promise<boolean> {
    try {
      const res = await apiService.cancelNavigation();
      return res.success;
    } catch (e) {
      return false;
    }
  }

  async returnToStart(): Promise<boolean> {
    try {
      const res = await apiService.returnToStart();
      return res.success;
    } catch (e) {
      return false;
    }
  }

  async emergencyStop(): Promise<boolean> {
    try {
      const res = await apiService.emergencyStop();
      return res.success;
    } catch (e) {
      return false;
    }
  }

  async resumeRobot(): Promise<boolean> {
    try {
      const res = await apiService.resumeRobot();
      return res.success;
    } catch (e) {
      return false;
    }
  }

  async manualMove(
    direction: 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'STOP',
    speed: number
  ): Promise<boolean> {
    try {
      const res = await apiService.manualMove(direction, speed);
      return res.success;
    } catch (e) {
      return false;
    }
  }

  async setSafetyDistance(cm: number): Promise<boolean> {
    try {
      const res = await apiService.setSafetyDistance(cm);
      return res.success;
    } catch (e) {
      return false;
    }
  }

  clearMap(): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify({ action: 'CLEAR_MAP' }));
    }
  }

  setOperationMode(mode: OperationMode): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify({ action: 'SET_MODE', mode }));
    }
  }

  toggleFilterPipeline(active: boolean): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify({ action: 'TOGGLE_FILTERS', active }));
    }
  }
}
