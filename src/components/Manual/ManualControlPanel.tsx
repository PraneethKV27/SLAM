import React, { useState, useEffect, useCallback } from 'react';
import { useRobot } from '../../context/RobotContext';
import { 
  Gamepad2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Square, 
  Sliders, 
  Keyboard,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export const ManualControlPanel: React.FC = () => {
  const { state, setOperationMode, manualMove } = useRobot();
  const [speed, setSpeed] = useState<number>(60);
  const [activeDirection, setActiveDirection] = useState<'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | null>(null);
  const [controlMode, setControlMode] = useState<'CONTINUOUS' | 'HOLD'>('CONTINUOUS');

  const isManual = state.operationMode === 'MANUAL';
  const safety = state.brakingSafety;

  const isFrontBlocked = state.obstacles.front <= state.safetyDistanceCm;
  const isRearBlocked = state.obstacles.rear <= state.safetyDistanceCm;
  const isInterlockActive = isManual && (
    (activeDirection === 'FORWARD' && isFrontBlocked) || 
    (activeDirection === 'BACKWARD' && isRearBlocked) ||
    ((safety?.isLockoutActive ?? false) && activeDirection === 'FORWARD')
  );

  const executeMove = useCallback((direction: 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'STOP') => {
    if (state.operationMode !== 'MANUAL') {
      setOperationMode('MANUAL');
    }
    setActiveDirection(direction === 'STOP' ? null : direction);
    manualMove(direction, speed);
  }, [state.operationMode, setOperationMode, manualMove, speed]);

  // Click handler (supports continuous toggle or single impulse)
  const handleButtonClick = (direction: 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT') => {
    if (controlMode === 'CONTINUOUS') {
      if (activeDirection === direction) {
        executeMove('STOP');
      } else {
        executeMove(direction);
      }
    } else {
      executeMove(direction);
    }
  };

  const handleButtonDown = (direction: 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT') => {
    if (controlMode === 'HOLD') {
      executeMove(direction);
    }
  };

  const handleButtonUp = () => {
    if (controlMode === 'HOLD') {
      executeMove('STOP');
    }
  };

  // Keyboard Hotkey Listener (WASD and Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        executeMove('FORWARD');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        executeMove('BACKWARD');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        executeMove('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        executeMove('RIGHT');
      } else if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        executeMove('STOP');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (controlMode === 'HOLD') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd', 'W', 'S', 'A', 'D'].includes(e.key)) {
          executeMove('STOP');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controlMode, executeMove]);

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-robot-cardBorder">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Manual Robot Control
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextMode = isManual ? 'AUTONOMOUS' : 'MANUAL';
                setOperationMode(nextMode);
                if (nextMode === 'AUTONOMOUS') setActiveDirection(null);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                isManual
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-glow-amber'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isManual ? 'MANUAL ACTIVE' : 'SWITCH TO MANUAL'}
            </button>
          </div>
        </div>

        {/* Mode & Drive Style Selector */}
        <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Drive Style:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setControlMode('CONTINUOUS')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                controlMode === 'CONTINUOUS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Click a direction once to drive continuously. Click STOP or click the button again to stop."
            >
              Click-to-Drive
            </button>
            <button
              onClick={() => setControlMode('HOLD')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                controlMode === 'HOLD'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hold button or key down to move; release to stop."
            >
              Hold-to-Drive
            </button>
          </div>
        </div>

        {/* Safety Collision Interlock Banner */}
        {isInterlockActive && (
          <div className="mt-3 p-3 rounded-lg bg-rose-950/90 border border-rose-500/80 text-xs text-rose-200 shadow-glow-red animate-pulse flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>DYNAMIC BRAKE INTERLOCK ACTIVE</span>
              </div>
              <span className="font-mono text-[11px] text-rose-200 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/60">
                Obstacle: {state.obstacles.front} cm
              </span>
            </div>
            <p className="text-[11px] text-rose-200">
              Forward path is blocked by hazard ($\le {state.safetyDistanceCm}$ cm). Back-EMF brake engaged. Use <strong className="text-white">Left (A)</strong> or <strong className="text-white">Right (D)</strong> to steer away!
            </p>
            
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono border-t border-rose-800/60">
              <div className="bg-rose-900/40 p-1 rounded">
                <span className="text-slate-400 block text-[9px]">STOPPING DIST</span>
                <span className="text-white font-bold">{(safety?.totalStoppingDistanceCm ?? 6.28).toFixed(1)} cm</span>
              </div>
              <div className="bg-rose-900/40 p-1 rounded">
                <span className="text-slate-400 block text-[9px]">BUFFER CLEAR</span>
                <span className="text-emerald-300 font-bold">{(safety?.bufferDistanceCm ?? 43.7).toFixed(1)} cm</span>
              </div>
              <div className="bg-rose-900/40 p-1 rounded">
                <span className="text-slate-400 block text-[9px]">SAFETY MARGIN</span>
                <span className="text-cyan-300 font-bold">+{((safety?.marginOfSafetyPct ?? 178)).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Motion Status Indicator */}
        <div className="mt-3 flex items-center justify-center">
          <span className={`text-[11px] font-mono px-3 py-1 rounded-full border ${
            activeDirection 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            {activeDirection ? `ACTIVE: ${activeDirection} (${speed}%)` : 'MOTORS STANDBY (CLICK TO MOVE)'}
          </span>
        </div>

        {/* Virtual Directional Controller D-Pad */}
        <div className="mt-3 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Forward */}
            <button
              onClick={() => handleButtonClick('FORWARD')}
              onMouseDown={() => handleButtonDown('FORWARD')}
              onMouseUp={handleButtonUp}
              onTouchStart={() => handleButtonDown('FORWARD')}
              onTouchEnd={handleButtonUp}
              className={`absolute top-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isFrontBlocked
                  ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-300 shadow-glow-red hover:bg-rose-900 active:scale-95'
                  : activeDirection === 'FORWARD'
                  ? 'bg-amber-500 text-slate-950 shadow-glow-amber scale-95 font-bold'
                  : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700 active:scale-95'
              }`}
              title={isFrontBlocked ? `Forward Blocked: Obstacle at ${state.obstacles.front} cm (Dynamic Brake Interlock)` : "Move Forward (W / Up)"}
            >
              <ArrowUp className="w-6 h-6" />
            </button>

            {/* Left */}
            <button
              onClick={() => handleButtonClick('LEFT')}
              onMouseDown={() => handleButtonDown('LEFT')}
              onMouseUp={handleButtonUp}
              onTouchStart={() => handleButtonDown('LEFT')}
              onTouchEnd={handleButtonUp}
              className={`absolute left-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                activeDirection === 'LEFT'
                  ? 'bg-amber-500 text-slate-950 shadow-glow-amber scale-95 font-bold'
                  : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700 active:scale-95'
              }`}
              title="Rotate Left (A / Left) - Always Available"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Center STOP */}
            <button
              onClick={() => executeMove('STOP')}
              className="w-12 h-12 rounded-xl bg-rose-600/90 hover:bg-rose-500 active:scale-90 text-white flex flex-col items-center justify-center font-bold text-[10px] shadow-glow-red transition-all border border-rose-400/40"
              title="Stop Motors Immediately (Space / Escape)"
            >
              <Square className="w-4 h-4 fill-white mb-0.5" />
              <span>STOP</span>
            </button>

            {/* Right */}
            <button
              onClick={() => handleButtonClick('RIGHT')}
              onMouseDown={() => handleButtonDown('RIGHT')}
              onMouseUp={handleButtonUp}
              onTouchStart={() => handleButtonDown('RIGHT')}
              onTouchEnd={handleButtonUp}
              className={`absolute right-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                activeDirection === 'RIGHT'
                  ? 'bg-amber-500 text-slate-950 shadow-glow-amber scale-95 font-bold'
                  : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700 active:scale-95'
              }`}
              title="Rotate Right (D / Right) - Always Available"
            >
              <ArrowRight className="w-6 h-6" />
            </button>

            {/* Backward */}
            <button
              onClick={() => handleButtonClick('BACKWARD')}
              onMouseDown={() => handleButtonDown('BACKWARD')}
              onMouseUp={handleButtonUp}
              onTouchStart={() => handleButtonDown('BACKWARD')}
              onTouchEnd={handleButtonUp}
              className={`absolute bottom-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isRearBlocked
                  ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-300 shadow-glow-red hover:bg-rose-900 active:scale-95'
                  : activeDirection === 'BACKWARD'
                  ? 'bg-amber-500 text-slate-950 shadow-glow-amber scale-95 font-bold'
                  : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700 active:scale-95'
              }`}
              title={isRearBlocked ? `Reverse Blocked: Obstacle at ${state.obstacles.rear} cm` : "Move Backward (S / Down)"}
            >
              <ArrowDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Speed Slider & Safety Monitor */}
      <div className="mt-4 pt-3 border-t border-robot-cardBorder">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1 text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Drive Speed:</span>
          </div>
          <span className="font-mono text-amber-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {speed}%
          </span>
        </div>

        <input
          type="range"
          min="15"
          max="100"
          step="5"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />

        {/* Quick Presets */}
        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
          {[25, 50, 75, 100].map((val) => (
            <button
              key={val}
              onClick={() => setSpeed(val)}
              className={`px-2 py-0.5 rounded ${speed === val ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:text-slate-200'}`}
            >
              {val}%
            </button>
          ))}
        </div>

        {/* Dynamic Braking Safety Monitor */}
        <div className="mt-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-emerald-400 font-sans font-semibold text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Dynamic Short-Circuit Brake
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              isInterlockActive 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {isInterlockActive ? 'LOCKOUT ENGAGED' : 'ARMED / PROTECTED'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-400">
            <div>Brake Decel: <span className="text-slate-200 font-bold">1.60 m/s²</span></div>
            <div>Stop Horizon: <span className="text-slate-200 font-bold">{(safety?.totalStoppingDistanceCm ?? 6.28).toFixed(1)} cm</span></div>
            <div>Lockout Dist: <span className="text-slate-200 font-bold">{state.safetyDistanceCm} cm</span></div>
            <div>Margin of Safety: <span className="text-cyan-300 font-bold">+{((safety?.marginOfSafetyPct ?? 178)).toFixed(0)}%</span></div>
          </div>
        </div>

        {/* Hotkey hint */}
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-500">
          <Keyboard className="w-3 h-3" />
          <span>Hotkeys: W/A/S/D • Space/Escape to Stop</span>
        </div>
      </div>
    </div>
  );
};
