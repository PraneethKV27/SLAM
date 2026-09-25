import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  RobotState, 
  SystemAlert, 
  Destination, 
  DataSourceMode, 
  OperationMode 
} from '../types/robot';
import { ISensorProvider } from '../services/SensorProvider';
import { LiveSensorProvider } from '../services/LiveSensorProvider';
import { SimulationSensorProvider } from '../services/SimulationSensorProvider';

interface RobotContextType {
  state: RobotState;
  provider: ISensorProvider;
  setDataSource: (source: DataSourceMode) => void;
  setOperationMode: (mode: OperationMode) => void;
  
  // Navigation
  setDestination: (x: number, y: number, label?: string) => Promise<boolean>;
  startNavigation: () => Promise<boolean>;
  pauseNavigation: () => Promise<boolean>;
  cancelNavigation: () => Promise<boolean>;
  returnToStart: () => Promise<boolean>;

  // Safety
  emergencyStop: () => Promise<boolean>;
  resumeRobot: () => Promise<boolean>;

  // Controls & Config
  manualMove: (direction: 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'STOP', speed: number) => Promise<boolean>;
  setSafetyDistance: (cm: number) => Promise<boolean>;
  clearMap: () => void;
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
  toggleFilterPipeline: (active: boolean) => void;

  // Map viewport triggers
  centerRobotTrigger: number;
  triggerCenterRobot: () => void;
  resetMapTrigger: number;
  triggerResetMap: () => void;
}

const initialRobotState: RobotState = {
  dataSource: 'DEMO',
  operationMode: 'AUTONOMOUS',
  navStatus: 'IDLE',
  isEmergencyStop: false,
  position: { x: -2.5, y: -1.8, heading: 45 },
  startPosition: { x: -2.5, y: -1.8, heading: 45 },
  destination: { x: 2.5, y: 1.8, label: 'Lab Waypoint B' },
  plannedPath: [],
  actualPath: [[-2.5, -1.8]],
  waypoints: [],
  distanceRemaining: 5.8,
  navigationProgress: 0,
  lidarScan: [],
  obstacles: {
    front: 145,
    left: 85,
    right: 210,
    rear: 310,
    nearest: 85,
    nearestAngle: 90,
  },
  safetyDistanceCm: 50,
  accumulatedMapPoints: [],
  imu: {
    roll: 0.1,
    pitch: 0.2,
    yaw: 45,
    accelX: 0,
    accelY: 0,
    accelZ: 9.81,
    gyroX: 0,
    gyroY: 0,
    gyroZ: 0,
    temperature: 32.4,
    i2cAddress: '0x68',
    status: 'ONLINE',
  },
  motors: [
    { id: 1, name: 'Motor 1', position: 'Front Left', driverModule: 'TB6612FNG #1', direction: 'STOP', speed: 0, pwm: 0, currentAmps: 0.05, status: 'STANDBY' },
    { id: 2, name: 'Motor 2', position: 'Front Right', driverModule: 'TB6612FNG #1', direction: 'STOP', speed: 0, pwm: 0, currentAmps: 0.05, status: 'STANDBY' },
    { id: 3, name: 'Motor 3', position: 'Rear Left', driverModule: 'TB6612FNG #2', direction: 'STOP', speed: 0, pwm: 0, currentAmps: 0.05, status: 'STANDBY' },
    { id: 4, name: 'Motor 4', position: 'Rear Right', driverModule: 'TB6612FNG #2', direction: 'STOP', speed: 0, pwm: 0, currentAmps: 0.05, status: 'STANDBY' },
  ],
  telemetry: {
    batteryVoltage: 12.4,
    batteryPercentage: 96,
    robotSpeed: 0,
    distanceTravelled: 0,
    navigationTimeSeconds: 0,
    lidarUpdateRate: 10,
    cameraFps: 30,
    imuUpdateRate: 100,
    cpuUsage: 28,
    cpuTemperature: 48,
    wifiRssi: -58,
  },
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
  cameraUrl: 'http://localhost:8000/video_feed',
  isCameraOnline: true,
  alerts: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      message: 'Autonomous Robot Navigation System initialized successfully.',
      severity: 'SUCCESS',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      message: 'LiDAR, MPU-6050 (0x68), and Dual TB6612FNG drivers ready.',
      severity: 'INFO',
    },
  ],
  isRerouting: false,
  filterPipelineActive: true,
};

const RobotContext = createContext<RobotContextType | null>(null);

export const RobotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataSource, setDataSourceState] = useState<DataSourceMode>('DEMO');
  const [state, setState] = useState<RobotState>(initialRobotState);
  const [centerRobotTrigger, setCenterRobotTrigger] = useState(0);
  const [resetMapTrigger, setResetMapTrigger] = useState(0);

  // Instantiating Providers
  const liveProvider = useMemo(() => new LiveSensorProvider(), []);
  const simProvider = useMemo(() => new SimulationSensorProvider(), []);

  const activeProvider = dataSource === 'LIVE' ? liveProvider : simProvider;

  // Sync state and alerts from active provider
  useEffect(() => {
    let mounted = true;

    // Connect active provider
    activeProvider.connect();

    const unsubState = activeProvider.subscribeState((update) => {
      if (!mounted) return;
      setState((prev) => ({
        ...prev,
        ...update,
        dataSource,
        position: update.position ? { ...update.position } : prev.position,
        telemetry: update.telemetry ? { ...prev.telemetry, ...update.telemetry } : prev.telemetry,
        hardware: update.hardware ? { ...prev.hardware, ...update.hardware } : prev.hardware,
      }));
    });

    const unsubAlerts = activeProvider.subscribeAlerts((alert) => {
      if (!mounted) return;
      setState((prev) => ({
        ...prev,
        alerts: [alert, ...prev.alerts.slice(0, 49)], // Keep latest 50 alerts
      }));
    });

    return () => {
      mounted = false;
      unsubState();
      unsubAlerts();
      activeProvider.disconnect();
    };
  }, [activeProvider, dataSource]);

  const setDataSource = useCallback((source: DataSourceMode) => {
    setDataSourceState(source);
    setState((prev) => ({
      ...prev,
      dataSource: source,
      alerts: [
        {
          id: `mode-switch-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          message: `Switched data source to ${source === 'LIVE' ? 'LIVE HARDWARE (Raspberry Pi)' : 'DEMO MODE (Simulated)'}`,
          severity: source === 'LIVE' ? 'WARNING' : 'INFO',
        },
        ...prev.alerts,
      ],
    }));
  }, []);

  const setOperationMode = useCallback((mode: OperationMode) => {
    setState((prev) => ({ ...prev, operationMode: mode }));
    if (activeProvider.setOperationMode) {
      activeProvider.setOperationMode(mode);
    }
    activeProvider.manualMove('STOP', 0);
  }, [activeProvider]);

  const setDestination = useCallback(
    async (x: number, y: number, label?: string) => {
      const dest: Destination = { x, y, label: label || `Goal (${x.toFixed(2)}, ${y.toFixed(2)})`, timestamp: Date.now() };
      setState((prev) => ({ ...prev, destination: dest }));
      return await activeProvider.sendDestination(dest);
    },
    [activeProvider]
  );

  const startNavigation = useCallback(async () => {
    return await activeProvider.startNavigation();
  }, [activeProvider]);

  const pauseNavigation = useCallback(async () => {
    return await activeProvider.pauseNavigation();
  }, [activeProvider]);

  const cancelNavigation = useCallback(async () => {
    return await activeProvider.cancelNavigation();
  }, [activeProvider]);

  const returnToStart = useCallback(async () => {
    return await activeProvider.returnToStart();
  }, [activeProvider]);

  const emergencyStop = useCallback(async () => {
    return await activeProvider.emergencyStop();
  }, [activeProvider]);

  const resumeRobot = useCallback(async () => {
    return await activeProvider.resumeRobot();
  }, [activeProvider]);

  const manualMove = useCallback(
    async (direction: 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'STOP', speed: number) => {
      return await activeProvider.manualMove(direction, speed);
    },
    [activeProvider]
  );

  const setSafetyDistance = useCallback(
    async (cm: number) => {
      setState((prev) => ({ ...prev, safetyDistanceCm: cm }));
      return await activeProvider.setSafetyDistance(cm);
    },
    [activeProvider]
  );

  const clearMap = useCallback(() => {
    activeProvider.clearMap();
    setState((prev) => ({
      ...prev,
      accumulatedMapPoints: [],
      actualPath: [[prev.position.x, prev.position.y]],
    }));
  }, [activeProvider]);

  const dismissAlert = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => a.id !== id),
    }));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setState((prev) => ({ ...prev, alerts: [] }));
  }, []);

  const toggleFilterPipeline = useCallback((active: boolean) => {
    setState((prev) => ({ ...prev, filterPipelineActive: active }));
    if (activeProvider.toggleFilterPipeline) {
      activeProvider.toggleFilterPipeline(active);
    }
  }, [activeProvider]);

  const triggerCenterRobot = useCallback(() => {
    setCenterRobotTrigger((prev) => prev + 1);
  }, []);

  const triggerResetMap = useCallback(() => {
    setResetMapTrigger((prev) => prev + 1);
  }, []);

  return (
    <RobotContext.Provider
      value={{
        state,
        provider: activeProvider,
        setDataSource,
        setOperationMode,
        setDestination,
        startNavigation,
        pauseNavigation,
        cancelNavigation,
        returnToStart,
        emergencyStop,
        resumeRobot,
        manualMove,
        setSafetyDistance,
        clearMap,
        dismissAlert,
        clearAllAlerts,
        toggleFilterPipeline,
        centerRobotTrigger,
        triggerCenterRobot,
        resetMapTrigger,
        triggerResetMap,
      }}
    >
      {children}
    </RobotContext.Provider>
  );
};

export const useRobot = () => {
  const context = useContext(RobotContext);
  if (!context) {
    throw new Error('useRobot must be used within a RobotProvider');
  }
  return context;
};
