import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRobot } from '../../context/RobotContext';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';

export const Map2D: React.FC = () => {
  const { 
    state, 
    setDestination, 
    clearMap, 
    toggleFilterPipeline,
    centerRobotTrigger, 
    resetMapTrigger 
  } = useRobot();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport transforms: zoom scale (pixels per meter) and center offsets
  const [scale, setScale] = useState<number>(65); // 65 px per meter
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showMinkowski, setShowMinkowski] = useState<boolean>(false);
  const [showOutliers, setShowOutliers] = useState<boolean>(false);
  const [cursorCoord, setCursorCoord] = useState<{ x: number; y: number } | null>(null);

  // Center on robot or reset view when triggers fire
  useEffect(() => {
    if (centerRobotTrigger > 0 && canvasRef.current) {
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      setOffset({
        x: w / 2 - state.position.x * scale,
        y: h / 2 + state.position.y * scale, // note: canvas Y is inverted from Cartesian Y
      });
    }
  }, [centerRobotTrigger, scale, state.position.x, state.position.y]);

  useEffect(() => {
    if (resetMapTrigger > 0 && canvasRef.current) {
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      setScale(65);
      setOffset({ x: w / 2, y: h / 2 });
    }
  }, [resetMapTrigger]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
        if (offset.x === 0 && offset.y === 0) {
          setOffset({ x: clientWidth / 2, y: clientHeight / 2 });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Coordinate conversion helpers
  // World (meters, Cartesian: +X right, +Y up) -> Canvas (pixels: +X right, +Y down)
  const worldToCanvas = useCallback(
    (wx: number, wy: number) => {
      return {
        cx: offset.x + wx * scale,
        cy: offset.y - wy * scale,
      };
    },
    [offset, scale]
  );

  // Canvas (pixels) -> World (meters)
  const canvasToWorld = useCallback(
    (cx: number, cy: number) => {
      return {
        wx: Number(((cx - offset.x) / scale).toFixed(2)),
        wy: Number(((offset.y - cy) / scale).toFixed(2)),
      };
    },
    [offset, scale]
  );

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = '#080c16';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Coordinate Grid (if enabled)
      if (showGrid) {
        ctx.save();
        const gridSpacingMeters = 1.0; // 1 meter grid
        const gridPx = gridSpacingMeters * scale;

        // Subgrid (0.5m)
        ctx.strokeStyle = 'rgba(25, 36, 56, 0.4)';
        ctx.lineWidth = 1;
        const subGridPx = 0.5 * scale;
        const startXSub = (offset.x % subGridPx) - subGridPx;
        for (let x = startXSub; x < width + subGridPx; x += subGridPx) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        const startYSub = (offset.y % subGridPx) - subGridPx;
        for (let y = startYSub; y < height + subGridPx; y += subGridPx) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Major 1m Grid
        ctx.strokeStyle = 'rgba(40, 58, 90, 0.7)';
        ctx.lineWidth = 1;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(100, 120, 160, 0.6)';

        const startX = (offset.x % gridPx) - gridPx;
        for (let x = startX; x < width + gridPx; x += gridPx) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();

          // Label meter coordinates
          const worldVal = ((x - offset.x) / scale).toFixed(0);
          if (x > 20 && x < width - 20) {
            ctx.fillText(`${worldVal}m`, x + 3, offset.y - 4 > 12 && offset.y - 4 < height ? offset.y - 4 : height - 6);
          }
        }

        const startY = (offset.y % gridPx) - gridPx;
        for (let y = startY; y < height + gridPx; y += gridPx) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();

          const worldVal = ((offset.y - y) / scale).toFixed(0);
          if (y > 20 && y < height - 20) {
            ctx.fillText(`${worldVal}m`, offset.x + 4 > 4 && offset.x + 4 < width - 25 ? offset.x + 4 : 4, y - 3);
          }
        }

        // World Origin (0,0) Axes
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 1.5;
        // X-Axis (y = 0)
        ctx.beginPath();
        ctx.moveTo(0, offset.y);
        ctx.lineTo(width, offset.y);
        ctx.stroke();
        // Y-Axis (x = 0)
        ctx.beginPath();
        ctx.moveTo(offset.x, 0);
        ctx.lineTo(offset.x, height);
        ctx.stroke();

        ctx.restore();
      }

      // 3. Draw Previously Accumulated SLAM / Occupancy Map Points
      if (state.accumulatedMapPoints.length > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(110, 135, 175, 0.45)';
        for (const [mx, my] of state.accumulatedMapPoints) {
          const pt = worldToCanvas(mx, my);
          ctx.fillRect(pt.cx - 2, pt.cy - 2, 4, 4);
        }
        ctx.restore();
      }

      // 4. Draw Travelled Trajectory (Actual Path History)
      if (state.actualPath.length > 1) {
        ctx.save();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const startPt = worldToCanvas(state.actualPath[0][0], state.actualPath[0][1]);
        ctx.moveTo(startPt.cx, startPt.cy);
        for (let i = 1; i < state.actualPath.length; i++) {
          const pt = worldToCanvas(state.actualPath[i][0], state.actualPath[i][1]);
          ctx.lineTo(pt.cx, pt.cy);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 5. Draw Planned Navigation Path
      if (state.plannedPath.length > 1) {
        ctx.save();
        // Glowing path effect
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const startPt = worldToCanvas(state.plannedPath[0][0], state.plannedPath[0][1]);
        ctx.moveTo(startPt.cx, startPt.cy);
        for (let i = 1; i < state.plannedPath.length; i++) {
          const pt = worldToCanvas(state.plannedPath[i][0], state.plannedPath[i][1]);
          ctx.lineTo(pt.cx, pt.cy);
        }
        ctx.stroke();

        // Draw Waypoint nodes along planned path
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a101d';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        for (let i = 1; i < state.plannedPath.length - 1; i++) {
          const pt = worldToCanvas(state.plannedPath[i][0], state.plannedPath[i][1]);
          ctx.beginPath();
          ctx.arc(pt.cx, pt.cy, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Draw Start Point Marker
      if (state.startPosition) {
        const startPos = worldToCanvas(state.startPosition.x, state.startPosition.y);
        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(startPos.cx, startPos.cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(startPos.cx, startPos.cy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('START', startPos.cx - 14, startPos.cy + 22);
        ctx.restore();
      }

      // 7. Draw Destination Point Marker
      if (state.destination) {
        const destPos = worldToCanvas(state.destination.x, state.destination.y);
        ctx.save();

        // Pulsing outer ring
        const pulseFactor = (Math.sin(Date.now() / 250) + 1) / 2; // 0 to 1
        const pulseRadius = 14 + pulseFactor * 8;

        ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 - pulseFactor * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(destPos.cx, destPos.cy, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner marker pin
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(destPos.cx, destPos.cy, 6, 0, Math.PI * 2);
        ctx.fill();

        // Destination Callout Badge
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(13, 18, 30, 0.9)';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1;

        const badgeW = 120;
        const badgeH = 34;
        const badgeX = destPos.cx - badgeW / 2;
        const badgeY = destPos.cy - 48;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fill();
        ctx.stroke();

        // Pointer notch
        ctx.beginPath();
        ctx.moveTo(destPos.cx - 5, badgeY + badgeH);
        ctx.lineTo(destPos.cx, badgeY + badgeH + 6);
        ctx.lineTo(destPos.cx + 5, badgeY + badgeH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText('DESTINATION', badgeX + 8, badgeY + 14);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(
          `X: ${state.destination.x.toFixed(2)}m  Y: ${state.destination.y.toFixed(2)}m`,
          badgeX + 8,
          badgeY + 27
        );

        ctx.restore();
      }

      // 8. Draw LiDAR Rays & Scan Points
      const robotCanvas = worldToCanvas(state.position.x, state.position.y);
      if (state.lidarScan && state.lidarScan.length > 0) {
        ctx.save();

        // Draw radial scan rays (subtle cyan laser fan)
        for (let i = 0; i < state.lidarScan.length; i += 2) {
          const pt = state.lidarScan[i];
          if (pt.x !== undefined && pt.y !== undefined) {
            const end = worldToCanvas(pt.x, pt.y);
            ctx.beginPath();
            ctx.moveTo(robotCanvas.cx, robotCanvas.cy);
            ctx.lineTo(end.cx, end.cy);
            ctx.strokeStyle = pt.isObstacle ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 240, 255, 0.04)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // 8a. Draw Minkowski Sum Obstacle Inflation Zone (R_inflated = 0.728m)
        if (showMinkowski) {
          ctx.save();
          const rInflatedPx = 0.728 * scale;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);

          // Sample representative obstacle points to avoid overdrawing
          for (let i = 0; i < state.lidarScan.length; i += 8) {
            const pt = state.lidarScan[i];
            if (pt.isObstacle && pt.x !== undefined && pt.y !== undefined) {
              const end = worldToCanvas(pt.x, pt.y);
              ctx.beginPath();
              ctx.arc(end.cx, end.cy, rInflatedPx, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }
          ctx.restore();
        }

        // 8b. Draw Rejected SOR Outlier Points (Dust Glints, Specular Flares)
        if (showOutliers && state.outlierLidarScan && state.outlierLidarScan.length > 0) {
          ctx.save();
          for (const opt of state.outlierLidarScan) {
            if (opt.x !== undefined && opt.y !== undefined) {
              const optEnd = worldToCanvas(opt.x, opt.y);
              ctx.strokeStyle = '#c084fc';
              ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
              ctx.lineWidth = 1.5;

              // Draw Crosshair (X)
              ctx.beginPath();
              ctx.moveTo(optEnd.cx - 3, optEnd.cy - 3);
              ctx.lineTo(optEnd.cx + 3, optEnd.cy + 3);
              ctx.moveTo(optEnd.cx + 3, optEnd.cy - 3);
              ctx.lineTo(optEnd.cx - 3, optEnd.cy + 3);
              ctx.stroke();

              // Outlier halo ring
              ctx.beginPath();
              ctx.arc(optEnd.cx, optEnd.cy, 5, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          ctx.restore();
        }

        // 8c. Draw Confirmed LiDAR Obstacle Points
        for (const pt of state.lidarScan) {
          if (pt.x !== undefined && pt.y !== undefined && pt.isObstacle) {
            const end = worldToCanvas(pt.x, pt.y);
            const dist = pt.distance;

            // Obstacles inside safety threshold glow bright red
            const isDanger = dist <= state.safetyDistanceCm / 100;

            ctx.fillStyle = isDanger ? '#ef4444' : '#f59e0b';
            ctx.shadowColor = isDanger ? '#ef4444' : '#f59e0b';
            ctx.shadowBlur = isDanger ? 8 : 4;

            ctx.beginPath();
            ctx.arc(end.cx, end.cy, isDanger ? 3.5 : 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 9. Draw Robot Model & Heading Vector
      ctx.save();
      ctx.translate(robotCanvas.cx, robotCanvas.cy);
      // Invert heading angle because canvas Y is flipped
      ctx.rotate((-state.position.heading * Math.PI) / 180);

      // Chassis footprint (approx 30cm x 24cm in scale)
      const robotWidthPx = 0.28 * scale;
      const robotLengthPx = 0.36 * scale;

      // 9a. Dynamic Short-Circuit Braking Corridor & Safety Margin
      const safetyM = state.safetyDistanceCm / 100;
      const safetyPx = safetyM * scale;
      const dStopM = (state.brakingSafety?.totalStoppingDistanceCm ?? 6.28) / 100;
      const dStopPx = dStopM * scale;
      const isLockout = state.brakingSafety?.isLockoutActive ?? (state.obstacles.front <= state.safetyDistanceCm);

      ctx.save();
      // Braking zone rectangle extending forward
      if (isLockout) {
        // Red flashing emergency brake locked corridor
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
      } else {
        // Green/cyan safety buffer corridor
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
      }

      ctx.beginPath();
      ctx.rect(robotLengthPx / 2, -robotWidthPx / 2, safetyPx, robotWidthPx);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Draw Dynamic Stopping Distance Threshold Horizon Line
      ctx.strokeStyle = isLockout ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(robotLengthPx / 2 + dStopPx, -robotWidthPx / 1.6);
      ctx.lineTo(robotLengthPx / 2 + dStopPx, robotWidthPx / 1.6);
      ctx.stroke();

      // Stopping distance HUD label
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = isLockout ? '#fca5a5' : '#6ee7b7';
      ctx.fillText(
        `d_stop: ${(dStopM * 100).toFixed(1)}cm`,
        robotLengthPx / 2 + dStopPx + 3,
        -robotWidthPx / 1.6
      );

      // Safety buffer label
      if (isLockout) {
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`BRAKE INTERLOCK (MoS: +${state.brakingSafety?.marginOfSafetyPct ?? 178}%)`, robotLengthPx / 2 + 10, robotWidthPx / 1.8 + 8);
      }
      ctx.restore();

      // LiDAR safety buffer circle
      ctx.strokeStyle = isLockout ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, (state.safetyDistanceCm / 100) * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Forward FOV cone / Headlight beam
      const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 1.2 * scale);
      gradient.addColorStop(0, isLockout ? 'rgba(239, 68, 68, 0.35)' : 'rgba(0, 240, 255, 0.25)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 1.2 * scale, -Math.PI / 4, Math.PI / 4);
      ctx.closePath();
      ctx.fill();

      // Four Wheels (representing 4 DC motors driven by 2x TB6612FNG)
      const wheelW = 0.06 * scale;
      const wheelL = 0.11 * scale;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;

      // Front Left Wheel
      ctx.fillRect(-robotLengthPx / 2.2, -robotWidthPx / 1.7, wheelL, wheelW);
      // Front Right Wheel
      ctx.fillRect(-robotLengthPx / 2.2, robotWidthPx / 1.7 - wheelW, wheelL, wheelW);
      // Rear Left Wheel
      ctx.fillRect(robotLengthPx / 2.2 - wheelL, -robotWidthPx / 1.7, wheelL, wheelW);
      // Rear Right Wheel
      ctx.fillRect(robotLengthPx / 2.2 - wheelL, robotWidthPx / 1.7 - wheelW, wheelL, wheelW);

      // Robot Chassis
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;

      // Forward pointing directional robot triangle/body
      ctx.beginPath();
      ctx.moveTo(robotLengthPx / 2, 0); // Front nose
      ctx.lineTo(-robotLengthPx / 2, -robotWidthPx / 2); // Rear Left
      ctx.lineTo(-robotLengthPx / 3, 0); // Inner center indent
      ctx.lineTo(-robotLengthPx / 2, robotWidthPx / 2); // Rear Right
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Central LiDAR turret housing
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 0.08 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spinning LiDAR laser indicator
      const lidarAngle = (Date.now() / 80) % (Math.PI * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(lidarAngle) * 0.07 * scale, Math.sin(lidarAngle) * 0.07 * scale);
      ctx.stroke();

      ctx.restore();

      // 10. Re-routing banner overlay on map
      if (state.isRerouting) {
        ctx.save();
        ctx.fillStyle = 'rgba(234, 88, 12, 0.25)';
        ctx.fillRect(0, 0, width, height);

        const bannerW = 280;
        const bannerH = 46;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect((width - bannerW) / 2, 60, bannerW, bannerH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RECALCULATING COLLISION-FREE PATH...', width / 2, 82);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "Inter", sans-serif';
        ctx.fillText('Obstacle detected inside safety zone', width / 2, 96);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, scale, offset, showGrid, worldToCanvas]);

  // Mouse Interaction: Pan and Set Destination
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Left click drag = Pan
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const world = canvasToWorld(cx, cy);
    setCursorCoord({ x: world.wx, y: world.wy });

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If it was a quick click without significant drag, set as destination!
    if (isDragging) {
      setIsDragging(false);
      const dragDist = Math.hypot(e.clientX - (dragStart.x + offset.x), e.clientY - (dragStart.y + offset.y));
      if (dragDist < 5 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const world = canvasToWorld(cx, cy);
        setDestination(world.wx, world.wy);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseCx = e.clientX - rect.left;
    const mouseCy = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.min(180, Math.max(25, scale * zoomFactor));

    // Zoom centered around cursor
    setOffset({
      x: mouseCx - (mouseCx - offset.x) * (newScale / scale),
      y: mouseCy - (mouseCy - offset.y) * (newScale / scale),
    });
    setScale(newScale);
  };

  const handleCenterRobot = () => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    setOffset({
      x: w / 2 - state.position.x * scale,
      y: h / 2 + state.position.y * scale,
    });
  };

  const handleResetView = () => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    setScale(65);
    setOffset({ x: w / 2, y: h / 2 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[460px] lg:h-[580px] rounded-xl overflow-hidden glass-panel border border-robot-cardBorder shadow-2xl select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full block ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      />

      {/* Floating HUD Controls */}
      <MapControls
        position={state.position}
        cursorCoord={cursorCoord}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onZoomIn={() => setScale((s) => Math.min(180, s * 1.25))}
        onZoomOut={() => setScale((s) => Math.max(25, s * 0.8))}
        onCenterRobot={handleCenterRobot}
        onResetView={handleResetView}
        onClearMap={clearMap}
        showMinkowski={showMinkowski}
        onToggleMinkowski={() => setShowMinkowski((s) => !s)}
        showOutliers={showOutliers}
        onToggleOutliers={() => setShowOutliers((s) => !s)}
        filterActive={state.filterPipelineActive}
        onToggleFilterActive={() => toggleFilterPipeline(!state.filterPipelineActive)}
      />

      {/* Map Legend */}
      <MapLegend />
    </div>
  );
};
