import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  Grid, 
  RotateCcw, 
  Trash2,
  Compass,
  ShieldCheck,
  Layers,
  Activity
} from 'lucide-react';
import { RobotPosition } from '../../types/robot';

interface MapControlsProps {
  position: RobotPosition;
  cursorCoord: { x: number; y: number } | null;
  showGrid: boolean;
  onToggleGrid: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenterRobot: () => void;
  onResetView: () => void;
  onClearMap: () => void;
  showMinkowski?: boolean;
  onToggleMinkowski?: () => void;
  showOutliers?: boolean;
  onToggleOutliers?: () => void;
  filterActive?: boolean;
  onToggleFilterActive?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  position,
  cursorCoord,
  showGrid,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onCenterRobot,
  onResetView,
  onClearMap,
  showMinkowski,
  onToggleMinkowski,
  showOutliers,
  onToggleOutliers,
  filterActive = true,
  onToggleFilterActive,
}) => {
  return (
    <>
      {/* Top Left: Robot Position & Hover Coordinates HUD */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 text-xs shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold font-mono">
            <Compass className="w-3.5 h-3.5" />
            <span>ROBOT:</span>
          </div>
          <div className="font-mono text-slate-200">
            X: <span className="text-cyan-300 font-bold">{position.x.toFixed(2)}</span> m
          </div>
          <div className="font-mono text-slate-200">
            Y: <span className="text-cyan-300 font-bold">{position.y.toFixed(2)}</span> m
          </div>
          <div className="font-mono text-slate-200">
            Heading: <span className="text-cyan-300 font-bold">{position.heading}°</span>
          </div>
        </div>

        {cursorCoord && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/70 backdrop-blur-sm border border-slate-800 text-[11px] font-mono text-slate-400">
            <span>CURSOR:</span>
            <span>X: {cursorCoord.x.toFixed(2)} m</span>
            <span>Y: {cursorCoord.y.toFixed(2)} m</span>
            <span className="text-[10px] text-cyan-400/80">(Click to set destination)</span>
          </div>
        )}
      </div>

      {/* Top Right: Interactive Map Viewport Buttons + Filter Quick Toggles */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl">
        {/* Filter Pipeline Master Toggle */}
        {onToggleFilterActive && (
          <button
            onClick={onToggleFilterActive}
            title={filterActive ? "Filter Pipeline: ACTIVE (6/6 Filters Cleaned)" : "Filter Pipeline: BYPASSED (Raw Sensor Jitter)"}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border ${
              filterActive
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 shadow-glow-emerald'
                : 'bg-amber-950/60 text-amber-400 border-amber-500/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{filterActive ? 'FILTERS ON' : 'RAW NOISE'}</span>
          </button>
        )}

        {/* Minkowski Inflation Ring Toggle */}
        {onToggleMinkowski && (
          <button
            onClick={onToggleMinkowski}
            title={showMinkowski ? "Hide Minkowski Inflation Zone (R = 0.728m)" : "Show Minkowski Inflation Zone (R = 0.728m)"}
            className={`p-2 rounded-lg transition-colors ${
              showMinkowski ? 'text-amber-400 bg-amber-950/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        {/* SOR Outliers Display Toggle */}
        {onToggleOutliers && (
          <button
            onClick={onToggleOutliers}
            title={showOutliers ? "Hide Filtered SOR Outliers (Dust/Glints)" : "Show Filtered SOR Outliers (Dust/Glints)"}
            className={`p-2 rounded-lg transition-colors ${
              showOutliers ? 'text-purple-400 bg-purple-950/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>
        )}

        <div className="h-4 w-px bg-slate-800"></div>

        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-800"></div>
        <button
          onClick={onCenterRobot}
          title="Center on Robot"
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleGrid}
          title={showGrid ? 'Hide Coordinate Grid' : 'Show Coordinate Grid'}
          className={`p-2 rounded-lg transition-colors ${
            showGrid ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={onResetView}
          title="Reset Map View"
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-800"></div>
        <button
          onClick={onClearMap}
          title="Clear Mapped Points & History"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
