import React, { useState } from 'react';
import { RobotProvider } from './context/RobotContext';
import { Header } from './components/Header';
import { Map2D } from './components/Map/Map2D';
import { CameraPanel } from './components/Camera/CameraPanel';
import { NavigationPanel } from './components/Navigation/NavigationPanel';
import { ObstaclePanel } from './components/Obstacles/ObstaclePanel';
import { ImuPanel } from './components/IMU/ImuPanel';
import { MotorPanel } from './components/Motors/MotorPanel';
import { TelemetryPanel } from './components/Telemetry/TelemetryPanel';
import { AlertLogPanel } from './components/Alerts/AlertLogPanel';
import { ManualControlPanel } from './components/Manual/ManualControlPanel';
import { HardwareStatusPanel } from './components/Hardware/HardwareStatusPanel';
import { EmergencyStopModal } from './components/Modals/EmergencyStopModal';
import { FilterAnalyticsPanel } from './components/Filters/FilterAnalyticsPanel';

export const DashboardContent: React.FC = () => {
  const [isFilterAnalyticsOpen, setIsFilterAnalyticsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col tech-grid-bg">
      {/* Top Header */}
      <Header onOpenFilterAnalytics={() => setIsFilterAnalyticsOpen(true)} />

      {/* Main Command Center Content */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1720px] w-full mx-auto flex flex-col gap-4">
        {/* ROW 1: 2D REAL-TIME MAP (Main Section) + CAMERA FEED */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 2D Real-Time Map - Largest screen component */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                2D REAL-TIME MAP • OCCUPANCY & LIDAR SCAN
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Top-Down Cartesian Grid • Polar-to-Cartesian Mapping
              </span>
            </div>
            <Map2D />
          </div>

          {/* Camera Feed Panel */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-mono font-bold tracking-wider text-blue-400 uppercase">
                ROBOT VISION • ONBOARD CAMERA
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Pi Camera v2 • 30 FPS
              </span>
            </div>
            <CameraPanel />
          </div>
        </section>

        {/* ROW 2: PRIMARY SENSOR & CONTROL MODULES (4-Column Desktop Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Navigation Panel */}
          <div className="h-full">
            <NavigationPanel />
          </div>

          {/* Obstacle Detection Panel */}
          <div className="h-full">
            <ObstaclePanel />
          </div>

          {/* IMU / Orientation Panel */}
          <div className="h-full">
            <ImuPanel />
          </div>

          {/* Motor Control & Status Panel */}
          <div className="h-full">
            <MotorPanel />
          </div>
        </section>

        {/* ROW 3: TELEMETRY, ALERTS & MANUAL CONTROL (3-Column Desktop Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Real-Time Telemetry */}
          <div className="h-full">
            <TelemetryPanel />
          </div>

          {/* Event & Alert Log */}
          <div className="h-full">
            <AlertLogPanel />
          </div>

          {/* Manual Robot Control D-Pad */}
          <div className="h-full md:col-span-2 xl:col-span-1">
            <ManualControlPanel />
          </div>
        </section>

        {/* ROW 4: HARDWARE & SUBSYSTEMS DIAGNOSTICS */}
        <section className="w-full">
          <HardwareStatusPanel />
        </section>
      </main>

      {/* Footer Info for Project & Viva Presentation */}
      <footer className="border-t border-robot-cardBorder bg-[#080b12] py-2.5 px-4 text-center text-xs text-slate-500 font-mono">
        Autonomous Mobile Robot with LiDAR-Based 2D Mapping, Navigation and Obstacle Detection • Final Year ECE Capstone Project
      </footer>

      {/* Safety Emergency Stop Lockdown Modal */}
      <EmergencyStopModal />

      {/* Mathematical Sensor Filters & Table 2 Analytics Modal */}
      <FilterAnalyticsPanel
        isOpen={isFilterAnalyticsOpen}
        onClose={() => setIsFilterAnalyticsOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <RobotProvider>
      <DashboardContent />
    </RobotProvider>
  );
}

export default App;
