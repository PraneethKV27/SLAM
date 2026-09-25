import React from 'react';
import { useRobot } from '../../context/RobotContext';
import { 
  Zap, 
  RotateCw, 
  RotateCcw 
} from 'lucide-react';
import { MotorDirection, MotorState } from '../../types/robot';

export const MotorPanel: React.FC = () => {
  const { state } = useRobot();
  const { motors } = state;

  const getDirectionBadge = (dir: MotorDirection) => {
    switch (dir) {
      case 'FORWARD':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
            <RotateCw className="w-3 h-3 animate-spin" /> FORWARD
          </span>
        );
      case 'REVERSE':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
            <RotateCcw className="w-3 h-3 animate-spin" /> REVERSE
          </span>
        );
      case 'BRAKE':
        return (
          <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">
            BRAKE
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            STOP
          </span>
        );
    }
  };

  const renderMotorCard = (motor: MotorState) => {
    const isActive = motor.speed > 0 && motor.direction !== 'STOP';

    return (
      <div 
        key={motor.id} 
        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/30 transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>{motor.name}</span>
              <span className="text-[10px] font-mono text-cyan-400 font-normal">({motor.position})</span>
            </div>
            <div className="text-[9px] font-mono text-slate-500">{motor.driverModule}</div>
          </div>
          {getDirectionBadge(motor.direction)}
        </div>

        {/* Speed Bar and PWM value */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-slate-400">Speed:</span>
            <span className="text-cyan-300 font-bold">{motor.speed}%</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-150 ${
                isActive ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-glow-cyan' : 'bg-slate-700'
              }`}
              style={{ width: `${motor.speed}%` }}
            ></div>
          </div>
        </div>

        {/* Footer info: Status, PWM, Current & Thermal */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[10px] font-mono text-slate-400">
          <div className="flex items-center justify-between">
            <div>
              PWM: <span className="text-slate-200">{motor.pwm}/255</span>
            </div>
            <div>
              I_filt: <span className="text-cyan-300 font-bold">{motor.currentAmps.toFixed(2)} A</span>
              {motor.rawCurrentAmps !== undefined && (
                <span className="text-[9px] text-amber-400/80 ml-1">({motor.rawCurrentAmps.toFixed(2)}A raw)</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pt-0.5 border-t border-slate-800/40 text-[9px]">
            <div>
              T_j: <span className="text-amber-300 font-semibold">{motor.junctionTempC ? motor.junctionTempC.toFixed(1) : '37.5'}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${motor.status === 'FAULT' ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
              <span className={motor.status === 'FAULT' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {motor.stallStatus === 'TRIPPED' ? 'STALL TRIP' : motor.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-robot-cardBorder">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                Motor Control & Status
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  2 × TB6612FNG
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              DRIVERS ACTIVE
            </span>
          </div>
        </div>

        {/* 4 Motors 2x2 Grid */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {motors.map((motor) => renderMotorCard(motor))}
        </div>

        {/* 1st-Order Bilinear IIR & Thermal Filter Status Bar */}
        <div className="mt-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col gap-1 text-[11px] font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              IIR CURRENT FILTER (α = 0.239)
            </span>
            <span className="text-emerald-400 font-bold">-46.0 dB PWM Rejection (94.3%)</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
            <div>
              Ripple: <span className="text-amber-400">420 mA</span> → <span className="text-emerald-400 font-semibold">24 mA</span>
            </div>
            <div>
              Debounce: <span className="text-cyan-300 font-semibold">250 ms</span> / Trip: <span className="text-rose-400 font-semibold">1.80 A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Chip Hardware Summary & Lumped Thermal Model Banner */}
      <div className="mt-3 pt-2.5 border-t border-robot-cardBorder flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono">
        <div>
          DMOS <span className="text-cyan-300 font-semibold">T_j: {(state.filterMetrics?.motor.junctionTempC ?? 37.5).toFixed(1)}°C</span>
          {' '} (Rise: +{(state.filterMetrics?.motor.tempRiseC ?? 12.5).toFixed(1)}°C / Limit: 150°C)
        </div>
        <div className="text-emerald-400">
          TB6612FNG (80mW loss) vs L298N (2.0W loss)
        </div>
      </div>
    </div>
  );
};
