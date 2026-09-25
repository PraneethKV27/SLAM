// TypeScript interfaces for Autonomous Mobile Robot Navigation System

export interface RobotPosition {
  x: number; // in meters
  y: number; // in meters
  heading: number; // in degrees (0 to 360, where 0 is +X East, 90 is +Y North)
}

export interface LidarPoint {
  angle: number; // in degrees (0 to 360 relative to robot heading or absolute)
  distance: number; // in meters
  intensity?: number;
  // Computed cartesian coordinates for mapping
  x?: number;
  y?: number;
  isObstacle?: boolean;
}

export interface ObstacleDistance {
  front: number; // in cm
  left: number; // in cm
  right: number; // in cm
  rear: number; // in cm
  nearest: number; // in cm
  nearestAngle: number; // in degrees
}

export type RobotNavStatus = 
  | 'IDLE' 
  | 'NAVIGATING' 
  | 'OBSTACLE DETECTED' 
  | 'RE-ROUTING' 
  | 'PAUSED' 
  | 'ARRIVED' 
  | 'EMERGENCY STOP';

export type OperationMode = 'AUTONOMOUS' | 'MANUAL';
export type DataSourceMode = 'LIVE' | 'DEMO';

export interface Destination {
  x: number;
  y: number;
  label?: string;
  timestamp?: number;
}

export interface Waypoint {
  id: string;
  x: number;
  y: number;
  reached?: boolean;
}

export interface ImuData {
  roll: number; // filtered degrees (Kalman estimate)
  pitch: number; // filtered degrees (Kalman estimate)
  yaw: number; // degrees (heading)
  rawRoll?: number; // raw unfiltered accelerometer angle
  rawPitch?: number; // raw unfiltered accelerometer angle
  kalmanGain?: number; // Kalman Gain K
  kalmanVariance?: number; // Error covariance P
  filterStatus?: string; // "KALMAN FILTER ACTIVE"
  accelX: number; // m/s^2
  accelY: number; // m/s^2
  accelZ: number; // m/s^2
  gyroX: number; // deg/s
  gyroY: number; // deg/s
  gyroZ: number; // deg/s
  temperature: number; // deg C
  i2cAddress: string; // "0x68"
  status: 'ONLINE' | 'OFFLINE';
}

export type MotorDirection = 'FORWARD' | 'REVERSE' | 'STOP' | 'BRAKE';

export interface MotorState {
  id: number;
  name: string;
  position: 'Front Left' | 'Front Right' | 'Rear Left' | 'Rear Right';
  driverModule: 'TB6612FNG #1' | 'TB6612FNG #2';
  direction: MotorDirection;
  speed: number; // percentage 0 - 100%
  pwm: number; // 0 - 255
  currentAmps: number;
  rawCurrentAmps?: number;
  filteredCurrentAmps?: number;
  junctionTempC?: number;
  stallStatus?: 'NORMAL' | 'DEBOUNCING' | 'TRIPPED';
  status: 'ONLINE' | 'ACTIVE' | 'STANDBY' | 'FAULT';
}

export interface TelemetryData {
  batteryVoltage: number; // V (e.g. 11.8 V for 3S LiPo)
  batteryPercentage: number; // %
  robotSpeed: number; // m/s
  distanceTravelled: number; // m
  navigationTimeSeconds: number; // seconds
  lidarUpdateRate: number; // Hz (e.g. 10 Hz)
  cameraFps: number; // FPS (e.g. 30 FPS)
  imuUpdateRate: number; // Hz (e.g. 100 Hz)
  cpuUsage: number; // %
  cpuTemperature: number; // deg C
  wifiRssi: number; // dBm
}

export interface HardwareStatus {
  raspberryPi: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  lidar: 'ONLINE' | 'OFFLINE' | 'SCANNING';
  camera: 'ONLINE' | 'OFFLINE' | 'STREAMING';
  mpu6050: 'ONLINE' | 'OFFLINE';
  motorDriver1: 'ONLINE' | 'OFFLINE' | 'FAULT';
  motorDriver2: 'ONLINE' | 'OFFLINE' | 'FAULT';
  wifi: 'CONNECTED' | 'DISCONNECTED';
  backend: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
}

export type AlertSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';

export interface SystemAlert {
  id: string;
  timestamp: string;
  message: string;
  severity: AlertSeverity;
}

export interface MapObstacle {
  x: number;
  y: number;
  radius: number;
  hits: number;
  lastSeen: number;
}

export interface BrakingSafetyMetrics {
  safetyThresholdCm: number;
  reactionDistanceCm: number;
  brakingDistanceCm: number;
  totalStoppingDistanceCm: number;
  bufferDistanceCm: number;
  marginOfSafetyPct: number;
  timeToCollisionSec: number;
  isLockoutActive: boolean;
  brakingDeceleration: number;
}

export interface FilterStatusMetrics {
  pipelineActive: boolean;
  imu: {
    rawPitch: number;
    rawRoll: number;
    filteredPitch: number;
    filteredRoll: number;
    kalmanGain: number;
    covariance: number;
    gyroBias: number;
    noiseRejectionPct: number;
  };
  lidar: {
    rawPointCount: number;
    filteredPointCount: number;
    outlierCount: number;
    ghostRejectionPct: number;
    meanNeighborDist: number;
    stdNeighborDist: number;
  };
  odometry: {
    rk2X: number;
    rk2Y: number;
    rk2Heading: number;
    eulerX: number;
    eulerY: number;
    eulerHeading: number;
    driftReductionPct: number;
  };
  motor: {
    rawCurrentAmps: number;
    filteredCurrentAmps: number;
    rippleReductionPct: number;
    rippleReductionDb: number;
    junctionTempC: number;
    tempRiseC: number;
    powerDissipatedW: number;
    thermalMarginC: number;
    stallDebounceMs: number;
    isStallTripped: boolean;
  };
  safety: BrakingSafetyMetrics;
}

export interface RobotState {
  // Mode & Status
  dataSource: DataSourceMode;
  operationMode: OperationMode;
  navStatus: RobotNavStatus;
  isEmergencyStop: boolean;
  
  // Spatial
  position: RobotPosition;
  startPosition: RobotPosition;
  destination: Destination | null;
  plannedPath: [number, number][]; // Array of [x, y] points in meters
  actualPath: [number, number][];  // History of travelled [x, y] in meters
  waypoints: Waypoint[];
  distanceRemaining: number;
  navigationProgress: number; // 0 - 100%
  
  // Sensors
  lidarScan: LidarPoint[];
  rawLidarScan?: LidarPoint[];
  outlierLidarScan?: LidarPoint[];
  obstacles: ObstacleDistance;
  safetyDistanceCm: number; // Configurable safety threshold, e.g. 50cm
  accumulatedMapPoints: [number, number][]; // Permanent SLAM-style map points
  
  // Hardware modules
  imu: ImuData;
  motors: MotorState[];
  telemetry: TelemetryData;
  hardware: HardwareStatus;
  
  // Mathematical Filter Pipeline & Telemetry
  filterPipelineActive: boolean;
  filterMetrics?: FilterStatusMetrics;
  brakingSafety?: BrakingSafetyMetrics;

  // Camera
  cameraUrl: string;
  isCameraOnline: boolean;
  
  // Alerts
  alerts: SystemAlert[];
  
  // Re-routing flag
  isRerouting: boolean;
}
