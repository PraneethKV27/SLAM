import React from 'react';
import { useRobot } from '../../context/RobotContext';
import { ShieldAlert, RotateCcw, ZapOff, CheckCircle } from 'lucide-react';

export const EmergencyStopModal: React.FC = () => {
  const { state, resumeRobot } = useRobot();

  if (!state.isEmergencyStop && state.navStatus !== 'EMERGENCY STOP') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel-danger border-2 border-rose-500/80 p-6 shadow-glow-red flex flex-col items-center text-center">
        {/* Pulsing Alarm Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950 border border-rose-500 shadow-glow-red animate-bounce">
          <ShieldAlert className="h-10 w-10 text-rose-400" />
        </div>

        <h2 className="mt-4 text-xl sm:text-2xl font-black uppercase tracking-wider text-rose-400 font-mono">
          EMERGENCY STOP ACTIVATED
        </h2>

        <p className="mt-2 text-sm text-slate-300">
          Hardware safety interlock triggered. All 4 DC motors halted, PWM output zeroed, and autonomous navigation aborted.
        </p>

        {/* Safety checklist */}
        <div className="mt-4 w-full rounded-xl bg-slate-950/70 border border-rose-950 p-3 text-left font-mono text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-semibold">
            <ZapOff className="w-4 h-4" />
            <span>Motor Drivers 1 & 2 (TB6612FNG) Standby Pins LOW</span>
          </div>
          <div className="flex items-center gap-2 text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Current Robot Position: ({state.position.x.toFixed(2)}m, {state.position.y.toFixed(2)}m)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Emergency Command Dispatched via WebSocket & REST</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={resumeRobot}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide shadow-glow-emerald transition-all transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            CONFIRM SAFETY & RESUME ROBOT
          </button>
        </div>
      </div>
    </div>
  );
};
