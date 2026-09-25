// Math and Coordinate Transformation Utilities for 2D LiDAR & Robot Kinematics

/**
 * Converts polar LiDAR measurement (distance & angle) relative to robot heading
 * into global 2D Cartesian coordinates (meters).
 * 
 * Formula:
 * x = robot_x + distance * cos(angle + heading)
 * y = robot_y + distance * sin(angle + heading)
 */
export function lidarPolarToCartesian(
  robotX: number,
  robotY: number,
  robotHeadingDeg: number,
  lidarAngleDeg: number,
  distanceMeters: number
): { x: number; y: number } {
  // Total angle in radians
  const totalAngleRad = ((lidarAngleDeg + robotHeadingDeg) * Math.PI) / 180;
  
  return {
    x: Number((robotX + distanceMeters * Math.cos(totalAngleRad)).toFixed(3)),
    y: Number((robotY + distanceMeters * Math.sin(totalAngleRad)).toFixed(3)),
  };
}

/**
 * Calculates Euclidean distance between two points in meters
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalizes an angle into [0, 360) range
 */
export function normalizeAngle(deg: number): number {
  let angle = deg % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Calculates heading angle in degrees from p1 to p2 (0 = East, 90 = North)
 */
export function calculateHeading(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return normalizeAngle(deg);
}

/**
 * Determines directional sector (front, left, right, rear) from LiDAR angle relative to robot heading
 */
export function getLidarSector(relativeAngleDeg: number): 'front' | 'left' | 'rear' | 'right' {
  const normalized = normalizeAngle(relativeAngleDeg);
  if (normalized >= 315 || normalized < 45) {
    return 'front';
  } else if (normalized >= 45 && normalized < 135) {
    return 'left';
  } else if (normalized >= 135 && normalized < 225) {
    return 'rear';
  } else {
    return 'right';
  }
}
