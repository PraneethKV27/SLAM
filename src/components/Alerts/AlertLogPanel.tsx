import React, { useState } from 'react';
import { useRobot } from '../../context/RobotContext';
import { 
  Bell, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Filter 
} from 'lucide-react';
import { AlertSeverity } from '../../types/robot';

export const AlertLogPanel: React.FC = () => {
  const { state, clearAllAlerts, dismissAlert } = useRobot();
  const [filter, setFilter] = useState<'ALL' | AlertSeverity>('ALL');

  const filteredAlerts = state.alerts.filter((alert) => {
    if (filter === 'ALL') return true;
    return alert.severity === filter;
  });

  const getAlertIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'DANGER':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />;
    }
  };

  const getAlertBorder = (severity: AlertSeverity) => {
    switch (severity) {
      case 'DANGER':
        return 'border-l-rose-500 bg-rose-950/20';
      case 'WARNING':
        return 'border-l-amber-500 bg-amber-950/20';
      case 'SUCCESS':
        return 'border-l-emerald-500 bg-emerald-950/20';
      default:
        return 'border-l-cyan-500 bg-cyan-950/15';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-robot-cardBorder">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Event & Alert System
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {state.alerts.length}
              </span>
            </h2>
          </div>

          <button
            onClick={clearAllAlerts}
            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Clear all alerts"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
          {(['ALL', 'DANGER', 'WARNING', 'SUCCESS', 'INFO'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filter === cat
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="mt-3 flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 italic">
              No events found in current filter.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-2 rounded-r-lg border border-slate-800/80 border-l-[3px] flex items-start justify-between gap-2 text-xs transition-all ${getAlertBorder(
                  alert.severity
                )}`}
              >
                <div className="flex items-start gap-2">
                  {getAlertIcon(alert.severity)}
                  <div>
                    <div className="text-slate-200 font-medium leading-tight">{alert.message}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">{alert.timestamp}</div>
                  </div>
                </div>

                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-slate-500 hover:text-slate-300 text-sm leading-none px-1"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2 border-t border-robot-cardBorder text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>Persistent FIFO ring buffer (50 events)</span>
        <span>WebSocket real-time push</span>
      </div>
    </div>
  );
};
