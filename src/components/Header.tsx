import React from 'react';
import { useRobot } from '../context/RobotContext';
import { 
  ShieldAlert, 
  RotateCcw,
  Radio,
  Atom
} from 'lucide-react';

interface HeaderProps {
  onOpenFilterAnalytics?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFilterAnalytics }) => {
  const { state, setDataSource, setOperationMode, emergencyStop, resumeRobot } = useRobot();

  const isEStop = state.isEmergencyStop || state.navStatus === 'EMERGENCY STOP';

  return (
    <header className="relative z-20 border-b border-robot-cardBorder bg-[#0a0e18]/90 backdrop-blur-md px-4 py-3 sm:px-6">
      {/* Simulation banner if in Demo Mode */}
      {state.dataSource === 'DEMO' && (
        <div className="mb-2 flex items-center justify-between rounded-md bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-semibold tracking-wider uppercase font-mono">DEMO MODE — SIMULATED SENSOR DATA</span>
            <span className="text-slate-400 hidden sm:inline">• Full Kinematic Robot Physics & LiDAR Raycasting Active</span>
          </div>
          <button 
            onClick={() => setDataSource('LIVE')}
            className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 px-2 py-0.5 rounded border border-cyan-500/40 transition-colors"
          >
            Switch to Live Hardware
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 shadow-glow-cyan">
            <Radio className="h-6 w-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Autonomous Robot Navigation System
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  v2.4 ECE
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Real-Time Mapping • Navigation • Obstacle Detection • Robot Monitoring
            </p>
          </div>
        </div>

        {/* Center: System Status & Mode Selectors */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Raspberry Pi Connection Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${
              state.hardware.raspberryPi === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">HARDWARE LINK</span>
              <span className="font-mono font-semibold text-slate-200">
                {state.hardware.raspberryPi === 'ONLINE' ? 'Raspberry Pi Connected' : 'Pi Offline'}
              </span>
            </div>
          </div>

          {/* Data Source Selector: LIVE vs DEMO */}
          <div className="flex items-center rounded-lg bg-slate-900/90 border border-slate-800 p-0.5">
            <button
              onClick={() => setDataSource('LIVE')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                state.dataSource === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LIVE HARDWARE
            </button>
            <button
              onClick={() => setDataSource('DEMO')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                state.dataSource === 'DEMO'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DEMO MODE
            </button>
          </div>

          {/* Operation Mode Selector: AUTONOMOUS vs MANUAL */}
          <div className="flex items-center rounded-lg bg-slate-900/90 border border-slate-800 p-0.5">
            <button
              onClick={() => setOperationMode('AUTONOMOUS')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                state.operationMode === 'AUTONOMOUS'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AUTONOMOUS
            </button>
            <button
              onClick={() => setOperationMode('MANUAL')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                state.operationMode === 'MANUAL'
                  ? 'bg-amber-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MANUAL
            </button>
          </div>

          {/* Mathematical Filter Pipeline Indicator & Modal Trigger */}
          <button
            onClick={onOpenFilterAnalytics}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              state.filterPipelineActive
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 shadow-glow-cyan'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
            }`}
            title="View Real-Time Mathematical Filter Analytics & Table 2 Verification"
          >
            <Atom className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[9px] text-slate-400 font-mono">MATH FILTERS</span>
              <span className="font-mono font-bold text-[11px]">
                {state.filterPipelineActive ? '6/6 ACTIVE (98.4%)' : 'BYPASS (RAW)'}
              </span>
            </div>
          </button>

          {/* Emergency Stop Button */}
          {isEStop ? (
            <button
              onClick={resumeRobot}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-glow-emerald animate-bounce"
            >
              <RotateCcw className="h-4 w-4" />
              Resume Robot
            </button>
          ) : (
            <button
              onClick={emergencyStop}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-glow-red border border-rose-400/50"
              title="Immediate Emergency Brake: Cut Motor Power"
            >
              <ShieldAlert className="h-4 w-4" />
              EMERGENCY STOP
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
