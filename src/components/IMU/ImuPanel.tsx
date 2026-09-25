import React from 'react';
import { useRobot } from '../../context/RobotContext';
import { 
  Compass, 
  Cpu, 
  Thermometer,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const ImuPanel: React.FC = () => {
  const { state } = useRobot();
  const { imu } = state;

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-robot-cardBorder">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                IMU / Orientation
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  MPU-6050
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
              I²C: {imu.i2cAddress}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/50 shadow-glow-emerald">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              KALMAN FILTER
            </span>
          </div>
        </div>

        {/* Kalman Filter State Bar */}
        <div className={`mt-2.5 p-2 rounded-lg border flex flex-col gap-1 text-xs transition-colors ${
          state.filterPipelineActive 
            ? 'bg-emerald-950/30 border-emerald-500/30' 
            : 'bg-amber-950/30 border-amber-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 font-mono text-[11px] font-semibold ${
              state.filterPipelineActive ? 'text-emerald-300' : 'text-amber-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                state.filterPipelineActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}></span>
              <span>{imu.filterStatus || (state.filterPipelineActive ? 'KALMAN ACTIVE (-95.4% JITTER)' : 'BYPASS (RAW NOISE)')}</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
              Q=0.001 / R=0.040
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
            <div>
              Gain <span className="text-emerald-400 font-semibold">K₀: {imu.kalmanGain ?? 0.043}</span>
              {' '} | Covar <span className="text-cyan-300 font-semibold">P₀₀: {imu.kalmanVariance ?? '0.0018'}</span>
            </div>
            <div>
              Bias <span className="text-amber-300 font-semibold">b: {state.filterMetrics?.imu.gyroBias.toFixed(2) ?? '0.00'}°/s</span>
              {' '} | Rej: <span className="text-emerald-400 font-bold">{state.filterMetrics?.imu.noiseRejectionPct ?? 95.4}%</span>
            </div>
          </div>
        </div>

        {/* Animated Attitude Indicator & Compass Ring */}
        <div className="mt-3 grid grid-cols-2 gap-3 items-center">
          {/* Artificial Horizon / Gyro Indicator */}
          <div className="relative flex items-center justify-center p-2 rounded-xl bg-slate-950/70 border border-slate-800 aspect-square max-h-[160px] mx-auto w-full overflow-hidden">
            {/* Compass Outer Ring with Degree Marks */}
            <div 
              className="absolute inset-2 rounded-full border-2 border-slate-700/60 transition-transform duration-150 ease-out"
              style={{ transform: `rotate(${-imu.yaw}deg)` }}
            >
              {/* Cardinal directions */}
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-400">N</span>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400">S</span>
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">E</span>
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">W</span>
            </div>

            {/* Artificial Horizon Sphere (Roll & Pitch) */}
            <div 
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/40 shadow-inner flex items-center justify-center"
              style={{ transform: `rotate(${imu.roll}deg)` }}
            >
              {/* Sky */}
              <div 
                className="absolute inset-0 bg-[#0f233f] transition-transform duration-100"
                style={{ transform: `translateY(${imu.pitch * 1.5}px)` }}
              >
                {/* Horizon Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_6px_#00f0ff]"></div>
                {/* Ground */}
                <div className="absolute top-1/2 left-0 right-0 bottom-0 bg-[#291b12]"></div>
              </div>

              {/* Fixed Aircraft/Robot Crossbar reticle */}
              <div className="relative z-10 w-12 flex items-center justify-between pointer-events-none">
                <div className="w-4 h-0.5 bg-yellow-400 shadow-sm"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                <div className="w-4 h-0.5 bg-yellow-400 shadow-sm"></div>
              </div>
            </div>

            {/* Current Heading digital badge */}
            <div className="absolute bottom-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-cyan-300 font-bold">
              HDG: {imu.yaw}°
            </div>
          </div>

          {/* Roll, Pitch, Yaw Metric Cards with Raw vs Kalman Comparison */}
          <div className="flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block leading-tight">Kalman Roll:</span>
                {imu.rawRoll !== undefined && (
                  <span className="text-[9px] font-mono text-amber-400/80">Raw: {imu.rawRoll > 0 ? `+${imu.rawRoll}` : imu.rawRoll}°</span>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-cyan-300">
                {imu.roll >= 0 ? `+${imu.roll.toFixed(1)}` : imu.roll.toFixed(1)}°
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block leading-tight">Kalman Pitch:</span>
                {imu.rawPitch !== undefined && (
                  <span className="text-[9px] font-mono text-amber-400/80">Raw: {imu.rawPitch > 0 ? `+${imu.rawPitch}` : imu.rawPitch}°</span>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-cyan-300">
                {imu.pitch >= 0 ? `+${imu.pitch.toFixed(1)}` : imu.pitch.toFixed(1)}°
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Yaw (Heading):</span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {imu.yaw}°
              </span>
            </div>
          </div>
        </div>

        {/* Secondary IMU Metrics: Accelerometer & Gyroscope */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block mb-0.5">ACCEL (m/s²)</span>
            <div className="text-slate-300 flex justify-between">
              <span>X: {imu.accelX.toFixed(2)}</span>
              <span>Y: {imu.accelY.toFixed(2)}</span>
              <span>Z: {imu.accelZ.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block mb-0.5">GYRO (°/s)</span>
            <div className="text-slate-300 flex justify-between">
              <span>X: {imu.gyroX.toFixed(0)}</span>
              <span>Y: {imu.gyroY.toFixed(0)}</span>
              <span>Z: {imu.gyroZ.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info: I2C wiring pinout & Kalman filter model */}
      <div className="mt-3 pt-2.5 border-t border-robot-cardBorder flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>I²C: <strong className="text-slate-200">0x68</strong> (AD0 → GND)</span>
        </div>
        <div>
          <span>Model: x=[θ, ḃ]^T</span>
        </div>
        <div className="flex items-center gap-1">
          <Thermometer className="w-3 h-3 text-amber-400" />
          <span>{imu.temperature.toFixed(1)} °C</span>
        </div>
      </div>
    </div>
  );
};
