/**
 * 2-State Discrete Kalman Filter for IMU Sensor Fusion (MPU-6050)
 * 
 * State Vector:
 * x = [ angle, gyro_bias ]^T
 * 
 * Fuses:
 * - Accelerometer tilt angle (good long-term static reference, but noisy due to motor vibration)
 * - Gyroscope angular rate (smooth dynamic reference, but suffers from low-frequency drift)
 */

export class KalmanFilter1D {
  private qAngle: number;   // Process noise variance for angle
  private qBias: number;    // Process noise variance for gyro bias
  private rMeasure: number; // Measurement noise variance for accelerometer tilt

  private angle: number = 0.0; // Filtered angle estimate
  private bias: number = 0.0;  // Estimated gyro bias drift
  private rate: number = 0.0;  // Unbiased angular velocity

  // 2x2 Error Covariance Matrix P
  private p00: number = 1.0;
  private p01: number = 0.0;
  private p10: number = 0.0;
  private p11: number = 1.0;

  // Kalman Gain vector [k0, k1]
  private k0: number = 0.0;
  private k1: number = 0.0;

  constructor(qAngle: number = 0.001, qBias: number = 0.003, rMeasure: number = 0.04) {
    this.qAngle = qAngle;
    this.qBias = qBias;
    this.rMeasure = rMeasure;
  }

  /**
   * Run one prediction-correction update iteration of the Kalman Filter
   * @param newAngleAcc Measured tilt angle from accelerometer (degrees)
   * @param newRateGyro Measured angular rate from gyroscope (deg/s)
   * @param dt Sampling time delta (seconds)
   * @returns Filtered optimal angle estimate (degrees)
   */
  public update(newAngleAcc: number, newRateGyro: number, dt: number): number {
    // -------------------------------------------------------------
    // Step 1: State Prediction
    // x_pred = A * x + B * u
    // angle = angle + dt * (rate_gyro - bias)
    // -------------------------------------------------------------
    this.rate = newRateGyro - this.bias;
    this.angle += dt * this.rate;

    // -------------------------------------------------------------
    // Step 2: Covariance Prediction
    // P_pred = A * P * A^T + Q
    // -------------------------------------------------------------
    this.p00 += dt * (dt * this.p11 - this.p01 - this.p10 + this.qAngle);
    this.p01 -= dt * this.p11;
    this.p10 -= dt * this.p11;
    this.p11 += this.qBias * dt;

    // -------------------------------------------------------------
    // Step 3: Innovation (Measurement Residual)
    // y = z - H * x_pred
    // -------------------------------------------------------------
    const y = newAngleAcc - this.angle;

    // -------------------------------------------------------------
    // Step 4: Innovation Covariance
    // S = H * P * H^T + R
    // -------------------------------------------------------------
    const S = this.p00 + this.rMeasure;

    // -------------------------------------------------------------
    // Step 5: Kalman Gain
    // K = P * H^T * S^-1
    // -------------------------------------------------------------
    this.k0 = this.p00 / S;
    this.k1 = this.p10 / S;

    // -------------------------------------------------------------
    // Step 6: State Correction / Update
    // x = x_pred + K * y
    // -------------------------------------------------------------
    this.angle += this.k0 * y;
    this.bias += this.k1 * y;

    // -------------------------------------------------------------
    // Step 7: Error Covariance Update
    // P = (I - K * H) * P
    // -------------------------------------------------------------
    const p00Temp = this.p00;
    const p01Temp = this.p01;

    this.p00 -= this.k0 * p00Temp;
    this.p01 -= this.k0 * p01Temp;
    this.p10 -= this.k1 * p00Temp;
    this.p11 -= this.k1 * p01Temp;

    return this.angle;
  }

  public getAngle(): number {
    return this.angle;
  }

  public getRate(): number {
    return this.rate;
  }

  public getKalmanGain(): number {
    return this.k0;
  }

  public getCovariance(): number {
    return this.p00;
  }

  public getBias(): number {
    return this.bias;
  }
}
