import React from 'react';
import { useRobot } from '../../context/RobotContext';
import { 
  Radar, 
  AlertTriangle, 
  ShieldCheck, 
  Sliders, 
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const ObstaclePanel: React.FC = () => {
  const { state, setSafetyDistance } = useRobot();
  const { obstacles, safetyDistanceCm, isRerouting, navStatus } = state;

  const isObstacleDetected = obstacles.nearest <= safetyDistanceCm || navStatus === 'OBSTACLE DETECTED';
  const isWarning = !isObstacleDetected && obstacles.nearest <= safetyDistanceCm + 30;

  const getStatusBadge = () => {
    if (isObstacleDetected) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-950/70 text-rose-400 border border-rose-500/60 shadow-glow-red animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          OBSTACLE DETECTED
        </span>
      );
    }
    if (isWarning) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/50 shadow-glow-amber">
          <AlertTriangle className="w-3.5 h-3.5" />
          WARNING
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/50">
        <ShieldCheck className="w-3.5 h-3.5" />
        CLEAR
      </span>
    );
  };

  const getDistanceColor = (cm: number) => {
    if (cm <= safetyDistanceCm) return 'text-rose-400 font-bold';
    if (cm <= safetyDistanceCm + 30) return 'text-amber-400 font-semibold';
    return 'text-emerald-400';
  };

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-robot-cardBorder">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Obstacle Detection
            </h2>
          </div>
          {getStatusBadge()}
        </div>

        {/* Hazard Alert / Re-routing Status Banner */}
        {isRerouting ? (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-300 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Recalculating path...</span> New path generated
            </div>
          </div>
        ) : isObstacleDetected ? (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/50 flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold">Obstacle detected at {(obstacles.nearest / 100).toFixed(2)} m</span>
              <div className="text-[11px] text-rose-200/80">Navigation paused for safety</div>
            </div>
          </div>
        ) : (
          <div className="mt-3 p-2 rounded-lg bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Nearest Obstacle:</span>
            <span className={`font-mono text-sm ${getDistanceColor(obstacles.nearest)}`}>
              {obstacles.nearest} cm <span className="text-slate-500 text-xs">(@ {obstacles.nearestAngle}°)</span>
            </span>
          </div>
        )}

        {/* 4-Sector Distance Matrix & Radar Ring Display */}
        <div className="mt-3 grid grid-cols-2 gap-3 items-center">
          {/* Circular Radar Graphic */}
          <div className="relative flex items-center justify-center p-3 rounded-xl bg-slate-950/60 border border-slate-800 aspect-square max-h-[160px] mx-auto w-full">
            {/* Range Rings */}
            <div className="absolute inset-4 rounded-full border border-slate-800/60"></div>
            <div className="absolute inset-8 rounded-full border border-slate-700/50"></div>
            <div className="absolute inset-12 rounded-full border border-cyan-500/20"></div>

            {/* Safety Distance Ring */}
            <div 
              className="absolute rounded-full border border-dashed border-rose-500/40"
              style={{
                width: `${Math.min(90, Math.max(30, (safetyDistanceCm / 150) * 100))}%`,
                height: `${Math.min(90, Math.max(30, (safetyDistanceCm / 150) * 100))}%`,
              }}
            ></div>

            {/* Sweep radar line */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-full h-full animate-radar-sweep origin-center bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent"></div>
            </div>

            {/* Center Robot Icon */}
            <div className="relative z-10 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center shadow-glow-cyan">
              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-slate-900 mb-0.5"></div>
            </div>

            {/* Directional Sector Indicators */}
            {/* Front */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold">
              <span className={getDistanceColor(obstacles.front)}>{obstacles.front}cm</span>
            </div>
            {/* Rear */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold">
              <span className={getDistanceColor(obstacles.rear)}>{obstacles.rear}cm</span>
            </div>
            {/* Left */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold">
              <span className={getDistanceColor(obstacles.left)}>{obstacles.left}cm</span>
            </div>
            {/* Right */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold">
              <span className={getDistanceColor(obstacles.right)}>{obstacles.right}cm</span>
            </div>
          </div>

          {/* Numerical 4-Way Distance Grid */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Front:</span>
              </div>
              <span className={`font-mono font-semibold ${getDistanceColor(obstacles.front)}`}>
                {obstacles.front} cm
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>Left:</span>
              </div>
              <span className={`font-mono font-semibold ${getDistanceColor(obstacles.left)}`}>
                {obstacles.left} cm
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                <span>Right:</span>
              </div>
              <span className={`font-mono font-semibold ${getDistanceColor(obstacles.right)}`}>
                {obstacles.right} cm
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rear:</span>
              </div>
              <span className={`font-mono font-semibold ${getDistanceColor(obstacles.rear)}`}>
                {obstacles.rear} cm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Distance Configuration Slider */}
      <div className="mt-4 pt-3 border-t border-robot-cardBorder">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1 text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Safety Distance:</span>
          </div>
          <span className="font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {safetyDistanceCm} cm ({ (safetyDistanceCm / 100).toFixed(2) } m)
          </span>
        </div>

        <input
          type="range"
          min="20"
          max="120"
          step="5"
          value={safetyDistanceCm}
          onChange={(e) => setSafetyDistance(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        {/* Quick presets */}
        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          <button
            onClick={() => setSafetyDistance(30)}
            className={`px-2 py-0.5 rounded ${safetyDistanceCm === 30 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'hover:text-slate-200'}`}
          >
            30 cm (Tight)
          </button>
          <button
            onClick={() => setSafetyDistance(50)}
            className={`px-2 py-0.5 rounded ${safetyDistanceCm === 50 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'hover:text-slate-200'}`}
          >
            50 cm (Default)
          </button>
          <button
            onClick={() => setSafetyDistance(80)}
            className={`px-2 py-0.5 rounded ${safetyDistanceCm === 80 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'hover:text-slate-200'}`}
          >
            80 cm (Safe)
          </button>
        </div>
      </div>
    </div>
  );
};
