import React from 'react';
import { useRobot } from '../../context/RobotContext';
import { 
  Server, 
  Radar, 
  Camera, 
  Compass, 
  Zap, 
  Wifi, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';

export const HardwareStatusPanel: React.FC = () => {
  const { state } = useRobot();
  const { hardware, telemetry } = state;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
      case 'CONNECTED':
      case 'SCANNING':
      case 'STREAMING':
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{status}</span>
          </div>
        );
      case 'CONNECTING':
      case 'DEGRADED':
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>{status}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>{status}</span>
          </div>
        );
    }
  };

  const hardwareItems = [
    {
      id: 'rpi',
      name: 'Raspberry Pi 3',
      detail: `BCM2837 • ${telemetry.cpuTemperature}°C`,
      status: hardware.raspberryPi,
      icon: Server,
    },
    {
      id: 'lidar',
      name: 'LiDAR Sensor',
      detail: 'RPLiDAR 360° • 10 Hz',
      status: hardware.lidar,
      icon: Radar,
    },
    {
      id: 'cam',
      name: 'Camera Module',
      detail: 'Pi Camera • 1280x720',
      status: hardware.camera,
      icon: Camera,
    },
    {
      id: 'imu',
      name: 'MPU-6050 IMU',
      detail: 'I²C 0x68 • 100 Hz',
      status: hardware.mpu6050,
      icon: Compass,
    },
    {
      id: 'md1',
      name: 'Motor Driver 1',
      detail: 'TB6612FNG (FL & FR)',
      status: hardware.motorDriver1,
      icon: Zap,
    },
    {
      id: 'md2',
      name: 'Motor Driver 2',
      detail: 'TB6612FNG (RL & RR)',
      status: hardware.motorDriver2,
      icon: Zap,
    },
    {
      id: 'wifi',
      name: 'Wi-Fi Interface',
      detail: `${telemetry.wifiRssi} dBm • 2.4/5 GHz`,
      status: hardware.wifi,
      icon: Wifi,
    },
    {
      id: 'backend',
      name: 'Python Backend',
      detail: 'FastAPI / WebSocket',
      status: hardware.backend,
      icon: Terminal,
    },
  ];

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-robot-cardBorder">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              System Hardware Status
            </h2>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/50 shadow-glow-emerald">
            ALL SYSTEMS NOMINAL
          </div>
        </div>

        {/* 8-Component Hardware Grid */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {hardwareItems.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id} 
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-slate-800/80 text-cyan-400 border border-slate-700/60">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{item.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{item.detail}</div>
                  </div>
                </div>
                <div>{getStatusBadge(item.status)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Board Telemetry Footer */}
      <div className="mt-3 pt-2.5 border-t border-robot-cardBorder flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div>
          CPU Load: <span className="text-cyan-300 font-semibold">{telemetry.cpuUsage}%</span>
        </div>
        <div>
          SoC Temp: <span className="text-amber-300 font-semibold">{telemetry.cpuTemperature}°C</span>
        </div>
        <div>
          RAM Usage: <span className="text-slate-200 font-semibold">412 MB / 1024 MB</span>
        </div>
        <div>
          Link Quality: <span className="text-emerald-400 font-semibold">98% (Excellent)</span>
        </div>
      </div>
    </div>
  );
};
