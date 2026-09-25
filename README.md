# Autonomous Mobile Robot Navigation System
### Real-Time Mapping • Navigation • Obstacle Detection • Robot Monitoring

A modern, professional, real-time web command center and monitoring interface for an autonomous mobile robot built with:
- **Raspberry Pi 3 Model B**
- **360° RPLiDAR Sensor**
- **Raspberry Pi Camera Module**
- **MPU-6050 6-DOF IMU** (`0x68` I²C Address)
- **4 DC Motors** (Differential 4WD Chassis)
- **2 × TB6612FNG Dual H-Bridge Motor Drivers**

---

## 🚀 Key Features

1. **2D Real-Time Occupancy & LiDAR Map (Main Section)**
   - Top-down Cartesian coordinate grid with meter scales and coordinate labels.
   - Live polar-to-Cartesian LiDAR raycasting: \( x = x_{robot} + d \cdot \cos(\theta + \text{heading}) \), \( y = y_{robot} + d \cdot \sin(\theta + \text{heading}) \).
   - High-contrast distinction between free space rays and detected obstacles.
   - Accumulated SLAM-style occupancy memory points and obstacle clusters.
   - Travelled actual trajectory vs planned navigation path comparison.
   - Zoom in/out, pan, center robot, reset view, and toggle grid overlay.
   - **Direct Destination Selection**: Click anywhere on the 2D map to set a destination point with live meter coordinates.

2. **Autonomous Path Planning & Auto Re-routing**
   - High-fidelity collision-free **A\* pathfinder** that inflates obstacle boundaries by configurable safety margins.
   - **Dynamic Re-routing**: When an obstacle enters the robot's safety corridor while navigating, the system pauses, displays *"Recalculating path..."*, computes an alternate collision-free trajectory, and safely resumes navigation.

3. **Dedicated Real-Time Obstacle Detection Panel**
   - 4-sector circular radar / proximity ring display showing Front, Left, Right, and Rear distances in centimeters.
   - Nearest obstacle distance and relative bearing angle.
   - Configurable Safety Distance slider (20 cm - 120 cm) with one-click presets.

4. **Robot Vision / Camera Feed**
   - Live video stream display with authentic robotics HUD (targeting crosshairs, timestamp, 30 FPS, 1280×720 resolution).
   - Fullscreen mode and one-click **Snapshot Downloader**.
   - Graceful *"Camera Offline"* handling with reconnection diagnostics.

5. **MPU-6050 IMU & Orientation Panel**
   - Live Roll, Pitch, and Yaw (Heading) angles.
   - Animated 3D/2D Artificial Horizon (pitch/roll attitude indicator) and rotating compass heading ring.
   - Explicit display of configured I²C address: `0x68` (AD0 tied to GND).

6. **Motor Control & Status (2 × TB6612FNG Modules)**
   - Dedicated monitoring for all 4 DC motors: FL, FR, RL, RR.
   - Real-time direction (FORWARD, REVERSE, STOP, BRAKE), speed %, PWM (0-255), and current draw.

7. **System Diagnostics & Telemetry**
   - Real-time battery voltage (12.4V) & %, speed (m/s), distance travelled, mission time.
   - Dual real-time sparkline telemetry graphs for Speed and Battery Discharge.
   - Subsystem status indicators: Raspberry Pi 3, LiDAR, Camera, IMU, Motor Drivers, Wi-Fi, Backend.

8. **Safety & Control Modes**
   - High-priority **EMERGENCY STOP** button with motor power interlock modal.
   - Seamless switching between **AUTONOMOUS** and **MANUAL** modes.
   - Virtual Directional Controller D-Pad + **Keyboard WASD / Arrow Keys** hotkey control.
   - **Demo / Simulation Mode** vs **Live Hardware Mode** with clean provider separation.

---

## 🛠️ Quick Start Guide

### 1. Run the Frontend Dashboard
```bash
# Navigate to project directory
cd robot-navigation-dashboard

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```
Open your browser at `http://localhost:5173`.

### 2. Run the Raspberry Pi 3 Python Backend
See [backend/HARDWARE_SETUP.md](backend/HARDWARE_SETUP.md) for full GPIO pinout tables and wiring diagrams.

```bash
cd backend
pip3 install -r requirements.txt
python3 robot_server.py
```

### 3. Connect Frontend to Live Robot
- Toggle from **DEMO MODE** to **LIVE HARDWARE** in the dashboard header.
- The dashboard communicates over WebSocket (`ws://<pi_ip>:8000/ws`) and REST APIs (`http://<pi_ip>:8000/api/...`).
