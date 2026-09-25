import React, { useState, useEffect } from 'react';
import { useRobot } from '../../context/RobotContext';
import { 
  Gauge, 
  Battery, 
  Clock, 
  Radar, 
  Camera, 
  Compass, 
  Activity, 
  TrendingUp, 
  Zap 
} from 'lucide-react';

export const TelemetryPanel: React.FC = () => {
  const { state } = useRobot();
  const { telemetry } = state;

  // Real-time sparkline historical buffers (keep last 20 points)
  const [speedHistory, setSpeedHistory] = useState<number[]>([0, 0, 0, 0, 0]);
  const [batteryHistory, setBatteryHistory] = useState<number[]>([12.4, 12.4, 12.4]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSpeedHistory((prev) => [...prev.slice(-24), telemetry.robotSpeed]);
      setBatteryHistory((prev) => [...prev.slice(-24), telemetry.batteryVoltage]);
    }, 600);
    return () => clearInterval(timer);
  }, [telemetry.robotSpeed, telemetry.batteryVoltage]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const getBatteryColor = (pct: number) => {
    if (pct > 50) return 'text-emerald-400';
    if (pct > 20) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-robot-cardBorder">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Live Robot Telemetry
            </h2>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-500/40">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            20 Hz STREAM
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Battery Voltage & Percentage */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>BATTERY</span>
              <Battery className={`w-4 h-4 ${getBatteryColor(telemetry.batteryPercentage)}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-base font-bold font-mono ${getBatteryColor(telemetry.batteryPercentage)}`}>
                {telemetry.batteryVoltage.toFixed(2)} V
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                ({telemetry.batteryPercentage}%)
              </span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${telemetry.batteryPercentage > 30 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ width: `${telemetry.batteryPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Robot Speed */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>ROBOT SPEED</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-bold font-mono text-cyan-300">
                {telemetry.robotSpeed.toFixed(2)}
              </span>
              <span className="text-[11px] font-mono text-slate-400">m/s</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              {((telemetry.robotSpeed * 3600) / 1000).toFixed(1)} km/h
            </div>
          </div>

          {/* Distance Travelled */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>DISTANCE</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-bold font-mono text-amber-300">
                {telemetry.distanceTravelled.toFixed(2)}
              </span>
              <span className="text-[11px] font-mono text-slate-400">m</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              Accumulated odometry
            </div>
          </div>

          {/* Navigation Time */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>MISSION TIME</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-1 text-base font-bold font-mono text-indigo-300">
              {formatTime(telemetry.navigationTimeSeconds)}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              Active run duration
            </div>
          </div>
        </div>

        {/* Secondary Sensor Sampling Frequencies */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Radar className="w-3.5 h-3.5 text-cyan-400" />
              <span>LiDAR Rate:</span>
            </div>
            <span className="font-mono text-xs font-semibold text-cyan-300">{telemetry.lidarUpdateRate} Hz</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Camera FPS:</span>
            </div>
            <span className="font-mono text-xs font-semibold text-blue-300">{telemetry.cameraFps} FPS</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>IMU Rate:</span>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-300">{telemetry.imuUpdateRate} Hz</span>
          </div>
        </div>
      </div>

      {/* Speed & Battery History Sparklines */}
      <div className="mt-3 pt-2.5 border-t border-robot-cardBorder grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
            <span>SPEED PROFILE:</span>
            <span className="text-cyan-400">{telemetry.robotSpeed.toFixed(2)} m/s</span>
          </div>
          <div className="h-8 w-full bg-slate-950/80 rounded-md p-1 flex items-end gap-1 overflow-hidden border border-slate-800/60">
            {speedHistory.map((val, idx) => {
              const barHeight = Math.max(12, Math.min(100, (val / 0.45) * 100));
              return (
                <div
                  key={idx}
                  className="flex-1 bg-cyan-500/70 hover:bg-cyan-400 rounded-t-sm transition-all"
                  style={{ height: `${barHeight}%` }}
                  title={`${val.toFixed(2)} m/s`}
                ></div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
            <span>BATTERY CURVE:</span>
            <span className="text-emerald-400">{telemetry.batteryVoltage.toFixed(2)} V</span>
          </div>
          <div className="h-8 w-full bg-slate-950/80 rounded-md p-1 flex items-end gap-1 overflow-hidden border border-slate-800/60">
            {batteryHistory.map((val, idx) => {
              const barHeight = Math.max(20, Math.min(100, ((val - 11.0) / (12.6 - 11.0)) * 100));
              return (
                <div
                  key={idx}
                  className="flex-1 bg-emerald-500/70 hover:bg-emerald-400 rounded-t-sm transition-all"
                  style={{ height: `${barHeight}%` }}
                  title={`${val.toFixed(2)} V`}
                ></div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
