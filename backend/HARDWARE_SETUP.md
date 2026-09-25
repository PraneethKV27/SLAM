# Autonomous Mobile Robot Hardware Setup & Raspberry Pi 3 Integration Guide

**Project Title:** Autonomous Mobile Robot with LiDAR-Based 2D Mapping, Navigation and Obstacle Detection  
**Hardware Platform:** Raspberry Pi 3 Model B, RPLiDAR A1/A2, Pi Camera Module, MPU-6050 IMU, 4 DC Motors, 2 × TB6612FNG Motor Drivers.

---

## 1. System Architecture Overview

```
                      +-----------------------------+
                      |   11.1V / 3S LiPo Battery   |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               | (Direct 11.1V)                            | (Step-down via 5V 3A UBEC)
               v                                           v
    +------------------------+                  +------------------------+
    | 2x TB6612FNG (VM Pin)  |                  |     Raspberry Pi 3     |
    +-----------+------------+                  +-----------+------------+
                |                                           |
    +-----------+------------+                  +-----------+------------+
    | 4x DC Geared Motors    |                  | Sensors & Peripherals  |
    | FL, FR, RL, RR         |                  | • RPLiDAR (USB UART)   |
    +------------------------+                  | • Camera (CSI Ribbon)  |
                                                | • MPU-6050 (I2C 0x68)  |
                                                +-----------+------------+
                                                            |
                                                +-----------v------------+
                                                | Python FastAPI Backend |
                                                | WebSocket & REST API   |
                                                +-----------+------------+
                                                            |
                                                +-----------v------------+
                                                | React Web Dashboard    |
                                                | (2D Mapping & Control) |
                                                +------------------------+
```

---

## 2. Complete GPIO & Pinout Mapping Table

### A. MPU-6050 6-DOF IMU (I²C Bus 1)
| MPU-6050 Pin | Raspberry Pi 3 Pin | Header Pin # | Description |
| :--- | :--- | :--- | :--- |
| **VCC** | 3.3V Power | Pin 1 | 3.3V Logic Supply |
| **GND** | Ground | Pin 6 | Common Ground |
| **SCL** | GPIO 3 (SCL) | Pin 5 | I2C Clock Line |
| **SDA** | GPIO 2 (SDA) | Pin 3 | I2C Data Line |
| **AD0** | GND | Common GND | **Tied to GND -> Sets I²C address to `0x68`** |
| **INT** | Optional (GPIO 4) | Pin 7 | Motion Interrupt (optional) |

> **Note:** Run `i2cdetect -y 1` on Raspberry Pi. You should see `68` populated in the address grid.

---

### B. Motor Driver Module #1: TB6612FNG (Front Left & Front Right)
| TB6612FNG #1 Pin | Raspberry Pi 3 Pin | Header Pin # | Function |
| :--- | :--- | :--- | :--- |
| **VM** | LiPo Battery (+) | Direct Battery | Motor Drive Voltage (7V - 12V) |
| **VCC** | 3.3V / 5V | Pin 1 / Pin 2 | Logic Supply |
| **GND** | Ground | Pin 9 / 14 | Logic & Power Common Ground |
| **STBY** | GPIO 13 | Pin 33 | Standby Control (Active HIGH) |
| **PWMA** | GPIO 12 (PWM0) | Pin 32 | Motor 1 (FL) Speed (Hardware PWM) |
| **AIN1** | GPIO 5 | Pin 29 | Motor 1 (FL) Direction 1 |
| **AIN2** | GPIO 6 | Pin 31 | Motor 1 (FL) Direction 2 |
| **PWMB** | GPIO 16 | Pin 36 | Motor 2 (FR) Speed (PWM) |
| **BIN1** | GPIO 19 | Pin 35 | Motor 2 (FR) Direction 1 |
| **BIN2** | GPIO 26 | Pin 37 | Motor 2 (FR) Direction 2 |
| **AO1 / AO2** | Motor 1 (FL) | Screw Terminal | Connected to Front Left DC Motor |
| **BO1 / BO2** | Motor 2 (FR) | Screw Terminal | Connected to Front Right DC Motor |

---

### C. Motor Driver Module #2: TB6612FNG (Rear Left & Rear Right)
| TB6612FNG #2 Pin | Raspberry Pi 3 Pin | Header Pin # | Function |
| :--- | :--- | :--- | :--- |
| **VM** | LiPo Battery (+) | Direct Battery | Motor Drive Voltage (7V - 12V) |
| **VCC** | 3.3V / 5V | Pin 1 / Pin 2 | Logic Supply |
| **GND** | Ground | Pin 20 / 25 | Common Ground |
| **STBY** | GPIO 22 | Pin 15 | Standby Control (Active HIGH) |
| **PWMA** | GPIO 18 (PWM0) | Pin 12 | Motor 3 (RL) Speed (Hardware PWM) |
| **AIN1** | GPIO 20 | Pin 38 | Motor 3 (RL) Direction 1 |
| **AIN2** | GPIO 21 | Pin 40 | Motor 3 (RL) Direction 2 |
| **PWMB** | GPIO 25 | Pin 22 | Motor 4 (RR) Speed (PWM) |
| **BIN1** | GPIO 23 | Pin 16 | Motor 4 (RR) Direction 1 |
| **BIN2** | GPIO 24 | Pin 18 | Motor 4 (RR) Direction 2 |
| **AO1 / AO2** | Motor 3 (RL) | Screw Terminal | Connected to Rear Left DC Motor |
| **BO1 / BO2** | Motor 4 (RR) | Screw Terminal | Connected to Rear Right DC Motor |

---

### D. RPLiDAR A1 / A2 Scanner
- **Connection:** USB Cable plugged directly into one of Raspberry Pi 3's 4 USB ports.
- **Port:** `/dev/ttyUSB0` (Baudrate: `115200`).
- **Permissions:** Run `sudo chmod 666 /dev/ttyUSB0` to allow the Python server to access the serial device.

---

### E. Raspberry Pi Camera Module (v2 / v3)
- **Connection:** 15-pin CSI ribbon cable plugged into the CAMERA port on the Raspberry Pi 3 (blue backing facing Ethernet/USB ports).
- **Enable Camera:** Run `sudo raspi-config` -> Interface Options -> Legacy Camera / Camera -> Enable -> Reboot.

---

## 3. How to Run the Backend on Raspberry Pi 3

### Step 1: Install System Dependencies on Raspberry Pi
```bash
sudo apt-get update
sudo apt-get install -y python3-pip python3-dev i2c-tools libgl1-mesa-glx
```

### Step 2: Install Python Libraries
Navigate to the `backend/` directory:
```bash
cd backend
pip3 install -r requirements.txt
```

### Step 3: Start the Robot Backend Server
```bash
python3 robot_server.py
```
Output:
```
============================================================
🤖 Autonomous Mobile Robot Backend Running on Raspberry Pi 3
📡 WebSocket: ws://0.0.0.0:8000/ws
🌐 REST API:  http://0.0.0.0:8000/docs
📹 Camera:    http://0.0.0.0:8000/video_feed
============================================================
```

---

## 4. How to Connect the Web Dashboard to the Live Robot

1. On your PC/Laptop, start the dashboard:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.
3. In the top header bar:
   - Click **`LIVE HARDWARE`** to switch from Simulation to Live mode.
   - Enter your Raspberry Pi's IP address (e.g. `192.168.1.100`) if prompted or configure in `LiveSensorProvider.ts`.
4. The dashboard will automatically establish:
   - Real-time WebSocket connection to `ws://<pi_ip>:8000/ws`
   - REST API requests to `http://<pi_ip>:8000/api/...`
   - Pi Camera live video stream from `http://<pi_ip>:8000/video_feed`
