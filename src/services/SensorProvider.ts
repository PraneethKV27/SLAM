import { RobotState, SystemAlert, Destination, OperationMode } from '../types/robot';

export interface ISensorProvider {
  name: string;
  isLive: boolean;

  // Lifecycle
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;

  // State Subscriptions
  subscribeState(callback: (update: Partial<RobotState>) => void): () => void;
  subscribeAlerts(callback: (alert: SystemAlert) => void): () => void;

  // Navigation Commands
  sendDestination(dest: Destination): Promise<boolean>;
  startNavigation(): Promise<boolean>;
  pauseNavigation(): Promise<boolean>;
  cancelNavigation(): Promise<boolean>;
  returnToStart(): Promise<boolean>;

  // Safety & Emergency
  emergencyStop(): Promise<boolean>;
  resumeRobot(): Promise<boolean>;

  // Manual Control
  manualMove(
    direction: 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'STOP',
    speed: number
  ): Promise<boolean>;

  // Configuration
  setOperationMode?(mode: OperationMode): void;
  setSafetyDistance(cm: number): Promise<boolean>;
  clearMap(): void;
  toggleFilterPipeline?(active: boolean): void;
}

