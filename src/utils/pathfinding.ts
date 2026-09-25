export interface ObstacleCircle {
  x: number;
  y: number;
  radius: number; // in meters
}

export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

interface GridNode {
  gx: number;
  gy: number;
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

export function planCollisionFreePathWithWalls(
  start: { x: number; y: number },
  goal: { x: number; y: number },
  obstacles: ObstacleCircle[],
  safetyMarginMeters: number = 0.35,
  gridResolution: number = 0.15,
  walls: WallSegment[] = []
): [number, number][] {
  const dist = Math.hypot(goal.x - start.x, goal.y - start.y);
  if (dist < 0.05) {
    return [[start.x, start.y], [goal.x, goal.y]];
  }

  const minX = Math.min(start.x, goal.x) - 2.5;
  const minY = Math.min(start.y, goal.y) - 2.5;

  const toGridX = (x: number) => Math.round((x - minX) / gridResolution);
  const toGridY = (y: number) => Math.round((y - minY) / gridResolution);
  const toWorldX = (gx: number) => minX + gx * gridResolution;
  const toWorldY = (gy: number) => minY + gy * gridResolution;

  const startGx = toGridX(start.x);
  const startGy = toGridY(start.y);

  const isObstacle = (x: number, y: number): boolean => {
    // Current robot position must be able to escape
    if (Math.hypot(x - start.x, y - start.y) < 0.28) {
      return false;
    }

    // Room boundary limits
    if (x < -3.6 || x > 3.6 || y < -2.6 || y > 2.6) return true;

    for (const obs of obstacles) {
      if (Math.hypot(x - obs.x, y - obs.y) < obs.radius + safetyMarginMeters) {
        return true;
      }
    }
    for (const wall of walls) {
      if (distToSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2) < safetyMarginMeters) {
        return true;
      }
    }
    return false;
  };

  const hasLineOfSight = (p1: { x: number; y: number }, p2: { x: number; y: number }): boolean => {
    const steps = Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 0.1);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = p1.x + t * (p2.x - p1.x);
      const y = p1.y + t * (p2.y - p1.y);
      if (isObstacle(x, y)) return false;
    }
    return true;
  };

  if (hasLineOfSight(start, goal)) {
    const points: [number, number][] = [];
    const steps = Math.max(2, Math.ceil(dist / 0.25));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push([
        Number((start.x + t * (goal.x - start.x)).toFixed(3)),
        Number((start.y + t * (goal.y - start.y)).toFixed(3))
      ]);
    }
    return points;
  }

  // A* Search on Grid
  const openSet: Map<string, GridNode> = new Map();
  const closedSet: Set<string> = new Set();
  const key = (gx: number, gy: number) => `${gx},${gy}`;

  const startNode: GridNode = {
    gx: startGx,
    gy: startGy,
    x: start.x,
    y: start.y,
    g: 0,
    h: Math.hypot(start.x - goal.x, start.y - goal.y),
    f: Math.hypot(start.x - goal.x, start.y - goal.y),
    parent: null,
  };

  openSet.set(key(startGx, startGy), startNode);

  const directions = [
    { dx: 1, dy: 0, cost: 1 },
    { dx: -1, dy: 0, cost: 1 },
    { dx: 0, dy: 1, cost: 1 },
    { dx: 0, dy: -1, cost: 1 },
    { dx: 1, dy: 1, cost: 1.414 },
    { dx: -1, dy: 1, cost: 1.414 },
    { dx: 1, dy: -1, cost: 1.414 },
    { dx: -1, dy: -1, cost: 1.414 },
  ];

  let iterations = 0;
  const maxIterations = 3000;
  let bestNode: GridNode = startNode;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;

    let current: GridNode | null = null;
    let minF = Infinity;
    for (const node of openSet.values()) {
      if (node.f < minF) {
        minF = node.f;
        current = node;
      }
    }

    if (!current) break;

    if (Math.hypot(current.x - goal.x, current.y - goal.y) <= gridResolution * 1.5) {
      bestNode = current;
      break;
    }

    const currentKey = key(current.gx, current.gy);
    openSet.delete(currentKey);
    closedSet.add(currentKey);

    if (current.h < bestNode.h) {
      bestNode = current;
    }

    for (const dir of directions) {
      const neighborGx = current.gx + dir.dx;
      const neighborGy = current.gy + dir.dy;
      const nKey = key(neighborGx, neighborGy);

      if (closedSet.has(nKey)) continue;

      const wx = toWorldX(neighborGx);
      const wy = toWorldY(neighborGy);

      if (isObstacle(wx, wy)) {
        closedSet.add(nKey);
        continue;
      }

      const tentativeG = current.g + dir.cost * gridResolution;
      const existing = openSet.get(nKey);

      if (!existing || tentativeG < existing.g) {
        const h = Math.hypot(wx - goal.x, wy - goal.y);
        const neighborNode: GridNode = {
          gx: neighborGx,
          gy: neighborGy,
          x: wx,
          y: wy,
          g: tentativeG,
          h: h,
          f: tentativeG + h,
          parent: current,
        };
        openSet.set(nKey, neighborNode);
      }
    }
  }

  const rawPath: [number, number][] = [];
  let curr: GridNode | null = bestNode;
  while (curr) {
    rawPath.unshift([Number(curr.x.toFixed(3)), Number(curr.y.toFixed(3))]);
    curr = curr.parent;
  }

  if (rawPath.length > 0) {
    rawPath[0] = [start.x, start.y];
    rawPath.push([goal.x, goal.y]);
  } else {
    rawPath.push([start.x, start.y], [goal.x, goal.y]);
  }

  // Path smoothing
  if (rawPath.length <= 2) return rawPath;
  const smoothed: [number, number][] = [rawPath[0]];
  let currentIndex = 0;

  while (currentIndex < rawPath.length - 1) {
    let furthestVisible = currentIndex + 1;
    for (let testIndex = rawPath.length - 1; testIndex > currentIndex + 1; testIndex--) {
      const p1 = { x: rawPath[currentIndex][0], y: rawPath[currentIndex][1] };
      const p2 = { x: rawPath[testIndex][0], y: rawPath[testIndex][1] };

      let lineClear = true;
      const steps = Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 0.1);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        if (isObstacle(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y))) {
          lineClear = false;
          break;
        }
      }

      if (lineClear) {
        furthestVisible = testIndex;
        break;
      }
    }

    smoothed.push(rawPath[furthestVisible]);
    currentIndex = furthestVisible;
  }

  return smoothed;
}

export const planCollisionFreePath = planCollisionFreePathWithWalls;
