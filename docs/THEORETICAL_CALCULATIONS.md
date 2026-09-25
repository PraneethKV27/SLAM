# Theoretical Calculations & Mathematical Formulations
## Autonomous Mobile Robot Navigation, LiDAR Mapping & Kalman Filtered IMU

**Project Title:** Autonomous Mobile Robot with LiDAR-Based 2D Mapping, Navigation and Obstacle Detection  
**Core Components:** Raspberry Pi 3, RPLiDAR A1/A2, MPU-6050 6-DOF IMU, 4 DC Motors, 2 × TB6612FNG Dual Driver Modules, 3S LiPo Battery.

---

## Table of Contents
1. [Differential Drive Mobile Robot Kinematics & Odometry](#1-differential-drive-mobile-robot-kinematics--odometry)
2. [2D LiDAR Polar-to-Cartesian Coordinate Transformation & Occupancy Grid](#2-2d-lidar-polar-to-cartesian-coordinate-transformation--occupancy-grid)
3. [MPU-6050 Sensor Fusion & Discrete Kalman Filter Derivation](#3-mpu-6050-sensor-fusion--discrete-kalman-filter-derivation)
4. [A* Collision-Free Path Planning & Heuristic Optimization](#4-a-collision-free-path-planning--heuristic-optimization)
5. [Time-to-Collision (TTC) & Safety Braking Distance Verification](#5-time-to-collision-ttc--safety-braking-distance-verification)
6. [Motor Dynamics, TB6612FNG Driver & Battery Power Budget](#6-motor-dynamics-tb6612fng-driver--battery-power-budget)

---

## 1. Differential Drive Mobile Robot Kinematics & Odometry

The autonomous mobile robot utilizes a 4-wheel skid-steer / differential drive configuration where left-side wheels (FL, RL) and right-side wheels (FR, RR) are driven independently by two TB6612FNG dual motor driver modules.

```
                  Front of Robot
             FL [=====]       [=====] FR
                 |                 |
                 |<------- L ----->|   (Track Width L = 0.22 m)
                 |                 |
             RL [=====]       [=====] RR
                  Rear of Robot
```

### 1.1 Forward Kinematics

Let:
- \( r = 0.033\text{ m} \) (Wheel radius, standard 66 mm diameter wheel)
- \( L = 0.22\text{ m} \) (Track width between left and right wheel contact lines)
- \( \omega_L, \omega_R \) = Left and right wheel angular velocities in \(\text{rad/s}\)
- \( v_L, v_R \) = Linear velocities of left and right wheels in \(\text{m/s}\)

The wheel tangential velocities are given by:
\[
v_L = r \cdot \omega_L = 2\pi r \left(\frac{N_L}{60}\right)
\]
\[
v_R = r \cdot \omega_R = 2\pi r \left(\frac{N_R}{60}\right)
\]
where \( N_L, N_R \) are the wheel rotational speeds in RPM.

The robot chassis linear velocity \( v \) and rotational yaw velocity \( \omega \) in the robot's local frame are:
\[
v = \frac{v_R + v_L}{2}
\]
\[
\omega = \frac{v_R - v_L}{L}
\]

The Instantaneous Center of Curvature (ICC) radius \( R_{ICC} \) is:
\[
R_{ICC} = \frac{v}{\omega} = \frac{L}{2} \cdot \left(\frac{v_R + v_L}{v_R - v_L}\right)
\]

### 1.2 Inverse Kinematics (Target \( v, \omega \) to Wheel Speeds)
Given a desired forward cruising speed \( v = 0.35\text{ m/s} \) and angular steering rate \( \omega \):
\[
v_L = v - \frac{\omega \cdot L}{2}
\]
\[
v_R = v + \frac{\omega \cdot L}{2}
\]
Required wheel RPM:
\[
N_L = \frac{60 \cdot v_L}{2\pi r} = \frac{60 \cdot v_L}{2\pi (0.033)} \approx 289.37 \cdot v_L \text{ RPM}
\]
\[
N_R = \frac{60 \cdot v_R}{2\pi r} = \frac{60 \cdot v_R}{2\pi (0.033)} \approx 289.37 \cdot v_R \text{ RPM}
\]

### 1.3 Dead Reckoning Odometry State Update (Runge-Kutta 2nd Order)
Let the robot pose vector be:
\[
\mathbf{q}_k = \begin{bmatrix} x_k \\ y_k \\ \theta_k \end{bmatrix}
\]
For a discrete sampling interval \( \Delta t \) (at 20 Hz, \( \Delta t = 0.05\text{ s} \)):
\[
\Delta \theta_k = \omega_k \cdot \Delta t = \left(\frac{v_{R,k} - v_{L,k}}{L}\right) \Delta t
\]
Using 2nd-order Midpoint Integration (avoids 1st-order Euler truncation drift):
\[
\theta_{\text{mid}} = \theta_{k-1} + \frac{\Delta \theta_k}{2}
\]
\[
\Delta s_k = v_k \cdot \Delta t = \left(\frac{v_{R,k} + v_{L,k}}{2}\right) \Delta t
\]
\[
x_k = x_{k-1} + \Delta s_k \cdot \cos(\theta_{\text{mid}})
\]
\[
y_k = y_{k-1} + \Delta s_k \cdot \sin(\theta_{\text{mid}})
\]
\[
\theta_k = \text{atan2}\left(\sin(\theta_{k-1} + \Delta \theta_k), \cos(\theta_{k-1} + \Delta \theta_k)\right)
\]

---

## 2. 2D LiDAR Polar-to-Cartesian Coordinate Transformation & Occupancy Grid

### 2.1 Coordinate Frame Transformation
The RPLiDAR A1 scanner rotates clockwise, generating 360 individual range measurements per revolution at 10 Hz (3600 samples/sec).

Each measurement arrives in sensor polar coordinates:
\[
\mathbf{z}_i = (\phi_i, d_i)
\]
where \( \phi_i \in [0, 360^\circ) \) is the ray angle relative to the LiDAR front index, and \( d_i \) is the measured range in meters.

```
                          World +Y (North)
                                ^
                                |
                                |      Obstacle Point (x_obs, y_obs)
                                |       *
                                |      /
                                |     / d_i
                                |    /
                         (x_r, y_r) / ) (phi_i + theta)
                        Robot  [R]---------> World +X (East)
```

To project into the global Cartesian coordinate frame:
\[
\alpha_i = \phi_i + \theta_{\text{robot}}
\]
\[
x_{\text{obs}, i} = x_{\text{robot}} + d_i \cdot \cos\left(\frac{\alpha_i \cdot \pi}{180}\right)
\]
\[
y_{\text{obs}, i} = y_{\text{robot}} + d_i \cdot \sin\left(\frac{\alpha_i \cdot \pi}{180}\right)
\]

#### Numerical Example:
- Robot pose: \( x_{\text{robot}} = 2.45\text{ m},\ y_{\text{robot}} = 1.82\text{ m},\ \theta_{\text{robot}} = 74^\circ \)
- LiDAR ray: \( \phi_i = 45^\circ,\ d_i = 1.25\text{ m} \)
- Total angle: \( \alpha_i = 45^\circ + 74^\circ = 119^\circ \)
\[
x_{\text{obs}} = 2.45 + 1.25 \cdot \cos(119^\circ) = 2.45 + 1.25 \cdot (-0.4848) = 2.45 - 0.606 = \mathbf{1.844\text{ m}}
\]
\[
y_{\text{obs}} = 1.82 + 1.25 \cdot \sin(119^\circ) = 1.82 + 1.25 \cdot (0.8746) = 1.82 + 1.093 = \mathbf{2.913\text{ m}}
\]

### 2.2 Log-Odds Occupancy Grid Mapping
The 2D space is discretized into cells of size \( \Delta c = 0.10\text{ m} \times 0.10\text{ m} \).  
Instead of storing probabilities \( p(m_{x,y}) \in [0, 1] \), cells store log-odds values \( l(m_{x,y}) \in (-\infty, +\infty) \) to prevent floating-point underflow:
\[
l(m) = \log\left(\frac{p(m)}{1 - p(m)}\right)
\]
When a LiDAR beam passes through free-space cells and hits an obstacle cell:
- For cells along the ray path (Free space, determined via Bresenham's algorithm):
  \[
  l_t(m) = l_{t-1}(m) + l_{\text{free}}
  \]
  where \( l_{\text{free}} = \log\left(\frac{0.35}{1 - 0.35}\right) = -0.619 \)
- For the termination cell (Obstacle impact):
  \[
  l_t(m) = l_{t-1}(m) + l_{\text{occ}}
  \]
  where \( l_{\text{occ}} = \log\left(\frac{0.85}{1 - 0.85}\right) = +1.735 \)

Recovering probability for dashboard rendering:
\[
p(m) = 1 - \frac{1}{1 + e^{l(m)}}
\]

---

## 3. MPU-6050 Sensor Fusion & Discrete Kalman Filter Derivation

### 3.1 The Problem with Raw MPU-6050 Data
The MPU-6050 contains a 3-axis accelerometer and a 3-axis MEMS gyroscope.
1. **Raw Accelerometer Flaw:** The accelerometer senses gravity vector \( \mathbf{g} \). While accurate in static conditions, when 4 DC motors spin and drive the chassis, high-frequency mechanical vibration creates severe acceleration spikes (\(\pm 3\text{ m/s}^2\)), causing raw tilt readings to wildly fluctuate by \(\pm 4^\circ\) to \(\pm 8^\circ\).
2. **Raw Gyroscope Flaw:** Integrating gyroscope angular velocity \( \theta = \int \omega_g \, dt \) is immune to chassis vibration in the short term, but micro-volt thermal bias causes **integration drift / random walk**, accumulating tens of degrees of error over several minutes.

**Solution:** A **2-State Discrete Linear Kalman Filter** fusing accelerometer tilt (low-frequency reference) and gyroscope angular rate (high-frequency reference).

---

### 3.2 Accelerometer Angle Derivation
From the 3-axis accelerometer registers (\( a_x, a_y, a_z \) in \(\text{m/s}^2\)):
\[
\theta_{\text{acc, roll}} = \text{atan2}(a_y, a_z) \cdot \frac{180}{\pi}
\]
\[
\theta_{\text{acc, pitch}} = \text{atan2}\left(-a_x, \sqrt{a_y^2 + a_z^2}\right) \cdot \frac{180}{\pi}
\]

---

### 3.3 State-Space Mathematical Formulation
Define the continuous-time state vector \( \mathbf{x}(t) \):
\[
\mathbf{x}(t) = \begin{bmatrix} \theta(t) \\ \dot{\theta}_{\text{bias}}(t) \end{bmatrix} = \begin{bmatrix} \text{True Angle} \\ \text{Gyroscope Bias Drift} \end{bmatrix}
\]
The physical relationship between true angular velocity and gyroscope reading \( \omega_g \) is:
\[
\dot{\theta}(t) = \omega_g(t) - \dot{\theta}_{\text{bias}}(t) + w_\theta(t)
\]
\[
\frac{d}{dt} \dot{\theta}_{\text{bias}}(t) = w_{\text{bias}}(t)
\]
where \( w_\theta \sim \mathcal{N}(0, Q_\theta) \) and \( w_{\text{bias}} \sim \mathcal{N}(0, Q_{\text{bias}}) \) are white process noises.

Discretizing with sampling time \( \Delta t \) (for \( f_s = 100\text{ Hz},\ \Delta t = 0.01\text{ s} \)):
\[
\mathbf{x}_k = \mathbf{A} \mathbf{x}_{k-1} + \mathbf{B} u_k + \mathbf{w}_k
\]
\[
\mathbf{A} = \begin{bmatrix} 1 & -\Delta t \\ 0 & 1 \end{bmatrix}, \quad \mathbf{B} = \begin{bmatrix} \Delta t \\ 0 \end{bmatrix}, \quad u_k = \omega_{g, k}
\]

The discrete measurement equation from the accelerometer tilt is:
\[
z_k = \theta_{\text{acc}, k} = \mathbf{H} \mathbf{x}_k + v_k
\]
\[
\mathbf{H} = \begin{bmatrix} 1 & 0 \end{bmatrix}, \quad v_k \sim \mathcal{N}(0, R)
\]

---

### 3.4 Covariance Matrices & Noise Tuning Parameters
- **Process Noise Covariance Matrix \( \mathbf{Q} \):**
  \[
  \mathbf{Q} = \begin{bmatrix} Q_\theta \cdot \Delta t & 0 \\ 0 & Q_{\text{bias}} \cdot \Delta t \end{bmatrix} = \begin{bmatrix} 0.001 \cdot 0.01 & 0 \\ 0 & 0.003 \cdot 0.01 \end{bmatrix} = \begin{bmatrix} 10^{-5} & 0 \\ 0 & 3 \times 10^{-5} \end{bmatrix}
  \]
- **Measurement Noise Covariance \( R \):**
  \[
  R = \sigma_{\text{acc}}^2 \approx 0.04 \ (\text{degrees}^2)
  \]
  Since \( R \gg Q_\theta \), the filter rejects sudden transient accelerometer vibration spikes.

---

### 3.5 The 5-Step Discrete Kalman Recursion Algorithm

#### Step 1: State Prediction Ahead
\[
\hat{\mathbf{x}}_{k|k-1} = \mathbf{A} \hat{\mathbf{x}}_{k-1|k-1} + \mathbf{B} u_k
\]
Expanded scalar form:
\[
\text{rate}_k = \omega_{g, k} - \hat{\dot{\theta}}_{\text{bias}, k-1}
\]
\[
\hat{\theta}_{k|k-1} = \hat{\theta}_{k-1|k-1} + \Delta t \cdot \text{rate}_k
\]

#### Step 2: Error Covariance Matrix Prediction
\[
\mathbf{P}_{k|k-1} = \mathbf{A} \mathbf{P}_{k-1|k-1} \mathbf{A}^T + \mathbf{Q}
\]
Expanding the \( 2 \times 2 \) matrix:
\[
P_{00|k-1} = P_{00} - \Delta t (P_{10} + P_{01}) + \Delta t^2 P_{11} + Q_\theta \Delta t
\]
\[
P_{01|k-1} = P_{01} - \Delta t P_{11}
\]
\[
P_{10|k-1} = P_{10} - \Delta t P_{11}
\]
\[
P_{11|k-1} = P_{11} + Q_{\text{bias}} \Delta t
\]

#### Step 3: Innovation (Measurement Residual)
\[
y_k = z_k - \mathbf{H} \hat{\mathbf{x}}_{k|k-1} = \theta_{\text{acc}, k} - \hat{\theta}_{k|k-1}
\]

#### Step 4: Innovation Covariance Scalar \( S_k \)
\[
S_k = \mathbf{H} \mathbf{P}_{k|k-1} \mathbf{H}^T + R = P_{00|k-1} + R
\]

#### Step 5: Kalman Gain Vector \( \mathbf{K}_k \)
\[
\mathbf{K}_k = \mathbf{P}_{k|k-1} \mathbf{H}^T S_k^{-1} = \frac{1}{S_k} \begin{bmatrix} P_{00|k-1} \\ P_{10|k-1} \end{bmatrix} = \begin{bmatrix} K_0 \\ K_1 \end{bmatrix}
\]

#### Step 6: State Update (Correction)
\[
\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + \mathbf{K}_k y_k
\]
\[
\hat{\theta}_k = \hat{\theta}_{k|k-1} + K_0 \cdot y_k
\]
\[
\hat{\dot{\theta}}_{\text{bias}, k} = \hat{\dot{\theta}}_{\text{bias}, k-1} + K_1 \cdot y_k
\]

#### Step 7: Error Covariance Update
\[
\mathbf{P}_{k|k} = (\mathbf{I} - \mathbf{K}_k \mathbf{H}) \mathbf{P}_{k|k-1}
\]
\[
P_{00, k} = P_{00|k-1} - K_0 \cdot P_{00|k-1}
\]
\[
P_{01, k} = P_{01|k-1} - K_0 \cdot P_{01|k-1}
\]
\[
P_{10, k} = P_{10|k-1} - K_1 \cdot P_{00|k-1}
\]
\[
P_{11, k} = P_{11|k-1} - K_1 \cdot P_{01|k-1}
\]

---

### 3.6 Step-by-Step Numerical Walkthrough (Demonstrating Noise Rejection)

**Initial Conditions at \( t = 0 \):**
- Angle \( \hat{\theta}_0 = 0.0^\circ \)
- Bias \( \hat{b}_0 = 0.0^\circ/\text{s} \)
- Uncertainty: \( \mathbf{P}_0 = \begin{bmatrix} 1.0 & 0 \\ 0 & 1.0 \end{bmatrix} \)
- Tuning: \( Q_\theta = 0.001,\ Q_{\text{bias}} = 0.003,\ R = 0.04,\ \Delta t = 0.01\text{ s} \)

**Iteration 1: Transient Shock / Motor Vibration Spike**
Suppose the robot is flat (\( 0^\circ \)), but motor vibration causes a raw accelerometer spike: \( z_1 = 3.50^\circ \), while gyroscope reads \( \omega_{g, 1} = 0.0^\circ/\text{s} \).

1. **Prediction:**
   \[
   \hat{\theta}_{1|0} = 0.0 + 0.01 \cdot (0 - 0) = 0.0^\circ
   \]
   \[
   P_{00|0} = 1.0 - 0.01(0 + 0) + (0.01)^2(1.0) + (0.001)(0.01) = 1.0001 + 0.00001 = 1.00011
   \]
2. **Innovation:**
   \[
   y_1 = 3.50^\circ - 0.0^\circ = 3.50^\circ
   \]
3. **Gain \( K \):**
   \[
   S_1 = 1.00011 + 0.04 = 1.04011
   \]
   \[
   K_0 = \frac{1.00011}{1.04011} \approx 0.9615
   \]
4. **Correction:**
   \[
   \hat{\theta}_1 = 0.0 + 0.9615 \cdot (3.50) = 3.36^\circ
   \]
   \[
   P_{00, 1} = (1 - 0.9615)(1.00011) \approx 0.0385
   \]

**Steady-State Iteration (After ~30 samples, \( P \) converges to \( P_\infty \approx 0.0018 \)):**
Now \( P_{00} = 0.0018 \). Another vibration spike hits: \( z_k = 4.2^\circ \), true robot angle \( \hat{\theta}_{k-1} = 0.8^\circ \), gyro \( \omega_g = 0 \).

1. **Prediction:**
   \[
   \hat{\theta}_{k|k-1} = 0.8^\circ
   \]
   \[
   P_{00|k-1} \approx 0.0018 + (0.001 \times 0.01) = 0.00181
   \]
2. **Innovation:**
   \[
   y_k = 4.2^\circ - 0.8^\circ = 3.4^\circ \quad \text{(Raw Vibration Noise Spike)}
   \]
3. **Kalman Gain:**
   \[
   S_k = 0.00181 + 0.04 = 0.04181
   \]
   \[
   K_0 = \frac{0.00181}{0.04181} = \mathbf{0.0433} \quad (\text{Only } 4.33\% \text{ weight given to raw noise!})
   \]
4. **Clean Filtered Angle:**
   \[
   \hat{\theta}_k = 0.8^\circ + 0.0433 \cdot (3.4^\circ) = 0.8^\circ + 0.147^\circ = \mathbf{0.947^\circ}
   \]
   **Result:** The raw \( 4.2^\circ \) vibration spike is suppressed down to \( 0.947^\circ \)—achieving **95.7% noise attenuation** while preserving true orientation changes.

---

## 4. A* Collision-Free Path Planning & Heuristic Optimization

The navigation module computes optimal collision-free paths from the robot's current coordinates \( (x_r, y_r) \) to the selected destination \( (x_d, y_d) \).

### 4.1 Cost Function
For each grid node \( n \):
\[
f(n) = g(n) + h(n)
\]
where:
- \( g(n) \): Actual accumulated path cost from the start node to node \( n \)
- \( h(n) \): Admissible heuristic estimating remaining distance to goal

### 4.2 Heuristic Function (Euclidean Metric)
Because the robot can turn at arbitrary angles (8-connected grid with diagonal movement):
\[
h(n) = \sqrt{(x_n - x_{\text{goal}})^2 + (y_n - y_{\text{goal}})^2}
\]
Since \( h(n) \le h^*(n) \) (straight-line distance is always \( \le \) actual obstacle-avoiding path length), the heuristic is strictly **admissible and consistent**, guaranteeing the shortest collision-free path.

### 4.3 Minkowski Sum Obstacle Inflation
A point robot model is used by inflating all detected circular obstacles and walls by the robot's clearance radius:
\[
R_{\text{inflated}} = R_{\text{chassis}} + d_{\text{safety}}
\]
where:
- \( R_{\text{chassis}} = \frac{\sqrt{\text{length}^2 + \text{width}^2}}{2} = \frac{\sqrt{0.36^2 + 0.28^2}}{2} \approx 0.228\text{ m} \)
- \( d_{\text{safety}} = 0.50\text{ m} \) (Safety margin)
- Total collision exclusion radius:
  \[
  R_{\text{inflated}} = 0.228 + 0.50 = \mathbf{0.728\text{ m}}
  \]
Any grid cell with Euclidean distance \( d \le R_{\text{inflated}} \) to an obstacle is marked in the closed set, forcing the A* search tree to route safely around it.

---

## 5. Time-to-Collision (TTC) & Safety Braking Distance Verification

The safety interlock guarantees the robot halts before contacting any obstacle, even in **MANUAL** mode.

### 5.1 Braking Kinematics
- Maximum robot speed: \( v_{\text{max}} = 0.40\text{ m/s} \)
- Total mass of robot: \( M \approx 2.4\text{ kg} \)
- Deceleration: Active H-Bridge short-circuit braking (both motor inputs HIGH/LOW simultaneously) produces dynamic back-EMF braking:
  \[
  a_{\text{brake}} = 1.6\text{ m/s}^2
  \]
- Software control loop latency: \( t_{\text{loop}} = 0.05\text{ s} \) (20 Hz loop)
- Wi-Fi + WebSocket network latency: \( t_{\text{net}} \approx 0.02\text{ s} \)
- Total reaction time: \( t_{\text{reaction}} = t_{\text{loop}} + t_{\text{net}} = 0.07\text{ s} \)

### 5.2 Stopping Distance Calculation
\[
d_{\text{stop}} = d_{\text{reaction}} + d_{\text{braking}}
\]
\[
d_{\text{reaction}} = v_{\text{max}} \cdot t_{\text{reaction}} = (0.40\text{ m/s}) \cdot (0.07\text{ s}) = 0.028\text{ m} = 2.8\text{ cm}
\]
\[
d_{\text{braking}} = \frac{v_{\text{max}}^2}{2 \cdot a_{\text{brake}}} = \frac{0.40^2}{2 \cdot 1.6} = \frac{0.16}{3.2} = 0.050\text{ m} = 5.0\text{ cm}
\]
\[
d_{\text{stop}} = 2.8\text{ cm} + 5.0\text{ cm} = \mathbf{7.8\text{ cm}}
\]

### 5.3 Safety Margin Margin of Safety (MoS)
With the configured safety distance \( d_{\text{safety}} = 50\text{ cm} \):
\[
\text{Buffer Distance} = d_{\text{safety}} - d_{\text{stop}} = 50\text{ cm} - 7.8\text{ cm} = \mathbf{42.2\text{ cm}}
\]
\[
\text{Time-to-Collision (TTC)} = \frac{d_{\text{safety}}}{v_{\text{max}}} = \frac{0.50\text{ m}}{0.40\text{ m/s}} = \mathbf{1.25\text{ seconds}}
\]
Since the physical stopping distance is only \( 7.8\text{ cm} \), triggering an auto-stop at \( 50\text{ cm} \) provides an overwhelming **6.4× safety factor**, mathematically guaranteeing zero physical impact.

---

## 6. Motor Dynamics, TB6612FNG Driver & Battery Power Budget

### 6.1 TB6612FNG Driver Conduction Loss
The TB6612FNG uses high-efficiency DMOS H-Bridges instead of lossy bipolar Darlington transistors (like the obsolete L298N).
- On-resistance per driver channel: \( R_{\text{ON}} = R_{\text{upper}} + R_{\text{lower}} \approx 0.50\ \Omega \)
- Operating current per motor: \( I_{\text{motor}} \approx 0.40\text{ A} \)
- Conduction voltage drop across driver:
  \[
  V_{\text{drop}} = I_{\text{motor}} \cdot R_{\text{ON}} = 0.40\text{ A} \times 0.50\ \Omega = \mathbf{0.20\text{ V}}
  \]
  *(Compare to L298N which drops 2.5V–3.2V, wasting massive power as heat).*
- Power dissipation per H-bridge:
  \[
  P_{\text{loss}} = I_{\text{motor}}^2 \cdot R_{\text{ON}} = (0.40)^2 \cdot 0.50 = 0.08\text{ W} = \mathbf{80\text{ mW}}
  \]
  Well within the package limit of 1.36 W without requiring a heatsink.

### 6.2 PWM Duty Cycle vs. Effective Armature Voltage
For an 11.1V battery and PWM duty cycle \( D \in [0, 1] \):
\[
V_{\text{effective}} = D \cdot (V_{\text{bat}} - V_{\text{drop}}) = D \cdot (11.1 - 0.20) = D \cdot 10.9\text{ V}
\]
At 60% manual drive speed (\( D = 0.60 \)):
\[
V_{\text{effective}} = 0.60 \times 10.9\text{ V} = \mathbf{6.54\text{ V}}
\]

### 6.3 System Power Budget & Battery Operating Life
The mobile robot is powered by an **11.1V 3S 2200 mAh LiPo battery** (Discharge rating: 25C).

| Subsystem | Operating Voltage | Current Draw (Nominal) | Power Draw |
| :--- | :--- | :--- | :--- |
| **Raspberry Pi 3 Model B** | 5.0 V (via UBEC) | 0.85 A @ 5V \(\to\) 0.42 A @ 11.1V | 4.25 W |
| **RPLiDAR A1 Sensor** | 5.0 V (via USB) | 0.40 A @ 5V \(\to\) 0.20 A @ 11.1V | 2.00 W |
| **Pi Camera Module v2** | 3.3 V (via CSI) | 0.25 A @ 3.3V \(\to\) 0.08 A @ 11.1V | 0.83 W |
| **MPU-6050 IMU** | 3.3 V (via I2C) | 0.004 A @ 3.3V | 0.013 W |
| **4 × DC Motors (Running @ 60%)** | 11.1 V (Direct VM) | \( 4 \times 0.40\text{ A} = 1.60\text{ A} \) | 17.76 W |
| **2 × TB6612FNG Logic** | 5.0 V (via VCC) | 0.02 A | 0.10 W |
| **Total Nominal Current @ 11.1V** | — | \( I_{\text{total}} \approx \mathbf{2.32\text{ A}} \) | \( P_{\text{total}} \approx \mathbf{24.95\text{ W}} \) |

### 6.4 Battery Runtime Calculation
Total stored battery energy:
\[
E_{\text{battery}} = V_{\text{nominal}} \cdot C_{\text{battery}} = 11.1\text{ V} \times 2.2\text{ Ah} = 24.42\text{ Watt-hours (Wh)}
\]
Applying an 80% Depth-of-Discharge (DoD) safety threshold for LiPo cell longevity:
\[
E_{\text{usable}} = 0.80 \times 24.42\text{ Wh} = 19.54\text{ Wh}
\]
Estimated continuous operating runtime:
\[
T_{\text{run}} = \frac{E_{\text{usable}}}{P_{\text{total}}} = \frac{19.54\text{ Wh}}{24.95\text{ W}} = 0.783\text{ hours} \approx \mathbf{47\text{ minutes}}
\]
Under typical navigation with periodic idle / waypoints, practical runtime extends to **~1 hour 15 minutes**.
