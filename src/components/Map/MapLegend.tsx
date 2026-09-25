import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-3 left-3 z-10 hidden sm:flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 pointer-events-none shadow-lg">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]"></span>
        <span>Robot</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]"></span>
        <span>Destination</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
        <span>LiDAR Obstacle</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full border border-purple-400 text-[8px] flex items-center justify-center text-purple-300 font-bold">×</span>
        <span>SOR Outlier</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full border border-dashed border-amber-500/80 bg-amber-500/10"></span>
        <span>Minkowski (0.728m)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-500"></span>
        <span>Wall / Mapped</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-0.5 bg-cyan-400"></span>
        <span>Planned Path</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-0.5 border-t border-dashed border-emerald-400"></span>
        <span>RK2 Trajectory</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full border border-cyan-400"></span>
        <span>Waypoint</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-0.5 bg-rose-500 shadow-[0_0_6px_#ef4444]"></span>
        <span>Dynamic Brake (50cm)</span>
      </div>
    </div>
  );
};
