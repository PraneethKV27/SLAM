import React, { useRef, useState, useEffect } from 'react';
import { useRobot } from '../../context/RobotContext';
import { 
  Camera, 
  Maximize2, 
  Minimize2, 
  Download, 
  Settings, 
  Wifi, 
  WifiOff, 
  Eye, 
  Crosshair 
} from 'lucide-react';

export const CameraPanel: React.FC = () => {
  const { state } = useRobot();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [streamUrl, setStreamUrl] = useState<string>('http://localhost:8000/video_feed');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isCameraOnline, setIsCameraOnline] = useState<boolean>(true);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  // Snapshot capture and download
  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `robot_cam_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Canvas HUD & Synthetic Camera Feed Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Render Synthetic Pi Camera View (Perspective Robot Eye View)
      if (isCameraOnline) {
        // Horizon gradient (indoor robotics test lab environment)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
        skyGrad.addColorStop(0, '#0a1120');
        skyGrad.addColorStop(1, '#111b2e');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.45);

        // Floor / Ground grid
        const floorGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
        floorGrad.addColorStop(0, '#0c1424');
        floorGrad.addColorStop(1, '#050811');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, h * 0.45, w, h * 0.55);

        // Perspective floor grid lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        const horizonY = h * 0.45;
        const centerX = w / 2;

        // Radiating perspective lines
        for (let x = -w * 0.6; x <= w * 1.6; x += 60) {
          ctx.beginPath();
          ctx.moveTo(centerX, horizonY);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        // Horizontal perspective lines
        for (let i = 1; i <= 8; i++) {
          const y = horizonY + Math.pow(i / 8, 2) * (h - horizonY);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Render detected obstacle box in camera field of view
        const nearestDistM = state.obstacles.nearest / 100;
        if (nearestDistM < 3.5) {
          const obsScale = Math.max(0.2, Math.min(1.2, (3.5 - nearestDistM) / 2.5));
          const boxW = 80 * obsScale;
          const boxH = 100 * obsScale;
          // Offset based on nearest obstacle angle
          const angleRad = ((state.obstacles.nearestAngle - 45) * Math.PI) / 180;
          const boxX = centerX + Math.sin(angleRad) * (w * 0.25) - boxW / 2;
          const boxY = horizonY + (h - horizonY) * 0.5 - boxH / 2;

          // Draw obstacle 3D box
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.fillRect(boxX, boxY, boxW, boxH);
          ctx.strokeRect(boxX, boxY, boxW, boxH);

          // Bounding Box AI Label
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(boxX, boxY - 18, boxW + 20, 16);
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText(`OBSTACLE ${(nearestDistM).toFixed(2)}m`, boxX + 4, boxY - 6);
        }

        // 2. Robotics HUD Overlay: Targeting Reticle & Brackets
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 1.5;

        // Center crosshair
        ctx.beginPath();
        ctx.arc(centerX, horizonY + 20, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX - 24, horizonY + 20);
        ctx.lineTo(centerX - 8, horizonY + 20);
        ctx.moveTo(centerX + 8, horizonY + 20);
        ctx.lineTo(centerX + 24, horizonY + 20);
        ctx.moveTo(centerX, horizonY + 20 - 24);
        ctx.lineTo(centerX, horizonY + 20 - 8);
        ctx.moveTo(centerX, horizonY + 20 + 8);
        ctx.lineTo(centerX, horizonY + 20 + 24);
        ctx.stroke();

        // Corner framing brackets
        const cornerSize = 16;
        const pad = 12;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 2;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(pad, pad + cornerSize);
        ctx.lineTo(pad, pad);
        ctx.lineTo(pad + cornerSize, pad);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(w - pad - cornerSize, pad);
        ctx.lineTo(w - pad, pad);
        ctx.lineTo(w - pad, pad + cornerSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(pad, h - pad - cornerSize);
        ctx.lineTo(pad, h - pad);
        ctx.lineTo(pad + cornerSize, h - pad);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(w - pad - cornerSize, h - pad);
        ctx.lineTo(w - pad, h - pad);
        ctx.lineTo(w - pad, h - pad - cornerSize);
        ctx.stroke();

        // Timestamp overlay
        ctx.fillStyle = '#00f0ff';
        ctx.font = '10px "JetBrains Mono", monospace';
        const now = new Date();
        ctx.fillText(`REC ● ${now.toISOString().slice(11, 19)}.${Math.floor(now.getMilliseconds() / 100)}`, pad + 6, h - pad - 6);

      } else {
        // Offline Screen
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CAMERA OFFLINE', w / 2, h / 2 - 8);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "Inter", sans-serif';
        ctx.fillText('Check Raspberry Pi Camera ribbon cable and Picamera2 service', w / 2, h / 2 + 14);
        ctx.textAlign = 'left';
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isCameraOnline, state.obstacles]);

  return (
    <div 
      ref={containerRef}
      className={`glass-panel rounded-xl p-4 flex flex-col justify-between ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 p-6' : 'h-full'
      }`}
    >
      {/* Header Bar */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-robot-cardBorder">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Robot Camera
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isCameraOnline ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/50 shadow-glow-emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Camera: ONLINE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-950/60 text-rose-400 border border-rose-500/50">
                Camera Offline
              </span>
            )}
          </div>
        </div>

        {/* Video Screen Container */}
        <div className="relative mt-3 rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-cover block"
          />

          {/* Top Video HUD Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-slate-700/60 text-[10px] font-mono text-cyan-300">
              FPS: 30
            </span>
            <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-slate-700/60 text-[10px] font-mono text-slate-300">
              1280 × 720
            </span>
          </div>

          {/* Top Right Live Tag */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 backdrop-blur-sm border border-rose-600/60 text-[10px] font-mono text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            LIVE STREAM
          </div>
        </div>

        {/* Config drawer for Real Pi Camera Stream */}
        {showSettings && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs">
            <label className="block text-[11px] text-slate-400 mb-1">Raspberry Pi Stream URL (MJPEG / HLS)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="http://192.168.1.50:8000/video_feed"
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => setShowSettings(false)}
                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="mt-3 pt-2.5 border-t border-robot-cardBorder flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCameraOnline(!isCameraOnline)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isCameraOnline
                ? 'bg-slate-800 text-slate-300 hover:text-white'
                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
            }`}
          >
            {isCameraOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isCameraOnline ? 'Simulate Offline' : 'Reconnect'}</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Stream Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={captureSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            title="Download Snapshot"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Snapshot
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
