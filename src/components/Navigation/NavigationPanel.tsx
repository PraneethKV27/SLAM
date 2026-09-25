import React, { useState } from 'react';
import { useRobot } from '../../context/RobotContext';
import { 
  Navigation, 
  Play, 
  Pause, 
  XSquare, 
  Home, 
  MapPin, 
  Compass, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send
} from 'lucide-react';
import { RobotNavStatus } from '../../types/robot';

export const NavigationPanel: React.FC = () => {
  const { 
    state, 
    setDestination, 
    startNavigation, 
    pauseNavigation, 
    cancelNavigation, 
    returnToStart 
  } = useRobot();

  const [inputX, setInputX] = useState<string>('2.50');
  const [inputY, setInputY] = useState<string>('1.80');
  const [showCoordInput, setShowCoordInput] = useState<boolean>(false);

  const handleManualSetDest = (e: React.FormEvent) => {
    e.preventDefault();
    const x = parseFloat(inputX);
    const y = parseFloat(inputY);
    if (!isNaN(x) && !isNaN(y)) {
      setDestination(x, y);
      setShowCoordInput(false);
    }
  };

  const getStatusBadge = (status: RobotNavStatus) => {
    switch (status) {
      case 'NAVIGATING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-500/50 shadow-glow-cyan">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            NAVIGATING
          </span>
        );
      case 'OBSTACLE DETECTED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-950/60 text-rose-400 border border-rose-500/50 shadow-glow-red animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            OBSTACLE DETECTED
          </span>
        );
      case 'RE-ROUTING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/50 shadow-glow-amber animate-pulse">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            RE-ROUTING
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-yellow-950/60 text-yellow-400 border border-yellow-500/50">
            <Pause className="w-3.5 h-3.5" />
            PAUSED
          </span>
        );
      case 'ARRIVED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/50 shadow-glow-emerald">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ARRIVED
          </span>
        );
      case 'EMERGENCY STOP':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-red-950/80 text-red-300 border border-red-500 shadow-glow-red">
            EMERGENCY STOP
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            IDLE
          </span>
        );
    }
  };

  const getEstimatedStatus = () => {
    if (state.isEmergencyStop) return 'EMERGENCY STOPPED — Motors locked';
    if (state.isRerouting) return 'Recalculating path around detected obstacle...';
    if (state.navStatus === 'OBSTACLE DETECTED') return 'Obstacle in path — Navigation paused for safety';
    if (state.navStatus === 'NAVIGATING') return 'Moving toward destination at cruising speed';
    if (state.navStatus === 'PAUSED') return 'Navigation paused by operator';
    if (state.navStatus === 'ARRIVED') return 'Destination reached — Holding position';
    return 'Robot is idle and ready for navigation';
  };

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-robot-cardBorder">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Navigation System
            </h2>
          </div>
          {getStatusBadge(state.navStatus)}
        </div>

        {/* Estimated Status Message */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-xs text-slate-300 font-medium truncate">
            {getEstimatedStatus()}
          </div>
        </div>

        {/* Position & Heading Grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {/* Current Position */}
          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>CURRENT POSITION</span>
            </div>
            <div className="mt-1 font-mono text-xs font-semibold text-slate-200">
              X: <span className="text-cyan-300">{state.position.x.toFixed(2)}</span> m | Y:{' '}
              <span className="text-cyan-300">{state.position.y.toFixed(2)}</span> m
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              Heading: <span className="text-slate-200 font-semibold">{state.position.heading}°</span>
            </div>
          </div>

          {/* Destination */}
          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>DESTINATION</span>
            </div>
            {state.destination ? (
              <>
                <div className="mt-1 font-mono text-xs font-semibold text-slate-200">
                  X: <span className="text-rose-300">{state.destination.x.toFixed(2)}</span> m | Y:{' '}
                  <span className="text-rose-300">{state.destination.y.toFixed(2)}</span> m
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                  {state.destination.label || 'Target Location'}
                </div>
              </>
            ) : (
              <div className="mt-1 text-xs text-slate-500 italic">None selected (click map)</div>
            )}
          </div>
        </div>

        {/* Navigation Progress & Distance Remaining */}
        <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800/70">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">DISTANCE REMAINING:</span>
            <span className="text-cyan-300 font-bold">{state.distanceRemaining.toFixed(2)} m</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">NAVIGATION PROGRESS:</span>
            <span className="text-emerald-400 font-bold">{state.navigationProgress}%</span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${state.navigationProgress}%` }}
            ></div>
          </div>

          {/* Planned vs Actual Path stats comparison */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
            <div>
              Planned: <span className="text-cyan-300 font-mono font-medium">{state.plannedPath.length} pts</span>
            </div>
            <div>
              Actual: <span className="text-emerald-300 font-mono font-medium">{state.actualPath.length} pts</span>
            </div>
            <div>
              Dev: <span className="text-slate-300 font-mono font-medium">±0.04 m</span>
            </div>
          </div>
        </div>

        {/* Manual Coordinate Input Drawer (Optional toggle) */}
        {showCoordInput && (
          <form onSubmit={handleManualSetDest} className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30">
            <div className="text-[11px] font-semibold text-cyan-300 mb-2">ENTER DESTINATION COORDINATES (METERS)</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">X Coordinate</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputX}
                  onChange={(e) => setInputX(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-200 font-mono focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Y Coordinate</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputY}
                  onChange={(e) => setInputY(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-200 font-mono focus:border-cyan-400 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCoordInput(false)}
                className="px-2 py-1 text-[11px] rounded text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-[11px] rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1"
              >
                <Send className="w-3 h-3" /> Apply
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="mt-4 pt-3 border-t border-robot-cardBorder flex flex-wrap gap-2">
        <button
          onClick={() => setShowCoordInput(!showCoordInput)}
          className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          Set Target
        </button>

        {state.navStatus === 'NAVIGATING' ? (
          <button
            onClick={pauseNavigation}
            className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold transition-colors shadow-md"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        ) : (
          <button
            onClick={startNavigation}
            disabled={!state.destination}
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-all ${
              state.destination
                ? 'bg-cyan-600 hover:bg-cyan-500 shadow-glow-cyan'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Start Nav
          </button>
        )}

        <button
          onClick={cancelNavigation}
          className="flex items-center justify-center p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 transition-colors"
          title="Cancel Navigation"
        >
          <XSquare className="w-4 h-4" />
        </button>

        <button
          onClick={returnToStart}
          className="flex items-center justify-center p-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/40 hover:text-emerald-300 text-slate-400 transition-colors"
          title="Return to Start Point"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
