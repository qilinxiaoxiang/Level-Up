import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types';
import { getLocalDateString } from '../../utils/dateUtils';

interface BurnDownModalProps {
  task: Task;
  onClose: () => void;
}

export default function BurnDownModal({ task, onClose }: BurnDownModalProps) {
  const [dailyMinutes, setDailyMinutes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const targetMinutes =
    task.estimated_minutes ?? (task.estimated_pomodoros ? task.estimated_pomodoros * 25 : 0);

  const startDate = task.created_at ? new Date(task.created_at) : new Date();
  const endDate = task.deadline ? new Date(task.deadline) : new Date();

  // Ensure endDate is after startDate
  if (endDate <= startDate) {
    endDate.setDate(startDate.getDate() + 7); // Default to 7 days if no proper deadline
  }

  const today = getLocalDateString();

  useEffect(() => {
    const fetchPomodoros = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('pomodoros')
        .select('completed_at, duration_minutes')
        .eq('task_id', task.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      if (!error && data) {
        const map: Record<string, number> = {};
        data.forEach((row) => {
          if (!row.completed_at) return;
          // Convert UTC timestamp to local date string using timezone-aware function
          const date = getLocalDateString(new Date(row.completed_at));
          map[date] = (map[date] || 0) + (row.duration_minutes || 0);
        });
        setDailyMinutes(map);
      }
      setLoading(false);
    };

    fetchPomodoros();
  }, [task.id]);

  // Generate timeline with virtual origin (day before creation)
  const { fullTimeline, virtualOrigin } = useMemo(() => {
    const days: string[] = [];

    // Add virtual origin: day before creation
    const dayBefore = new Date(startDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const origin = getLocalDateString(dayBefore);
    days.push(origin);

    // Add all days from creation to deadline
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      days.push(getLocalDateString(current));
      current.setDate(current.getDate() + 1);
    }

    return { fullTimeline: days, virtualOrigin: origin };
  }, [startDate, endDate]);

  // Timeline for actual line (virtual origin + days up to today)
  const actualTimeline = useMemo(() => {
    return fullTimeline.filter((date) => date === virtualOrigin || date <= today);
  }, [fullTimeline, today, virtualOrigin]);

  // Calculate ideal remaining time for full timeline (including virtual origin)
  const idealData = useMemo(() => {
    const totalDays = fullTimeline.length - 1; // -1 because origin doesn't count as a day
    const dailyIdealBurn = totalDays > 0 ? targetMinutes / totalDays : 0;

    return fullTimeline.map((date, index) => {
      const idealRemaining = Math.max(targetMinutes - dailyIdealBurn * index, 0);
      return { date, index, idealRemaining, isVirtual: date === virtualOrigin };
    });
  }, [fullTimeline, targetMinutes, virtualOrigin]);

  // Calculate actual remaining time (only up to today)
  const actualData = useMemo(() => {
    let remaining = targetMinutes;

    return actualTimeline.map((date) => {
      if (date === virtualOrigin) {
        // Virtual origin starts at full target
        return {
          date,
          actualRemaining: targetMinutes,
          isVirtual: true,
        };
      } else {
        // Real days: subtract completed minutes
        const spent = dailyMinutes[date] || 0;
        remaining = Math.max(remaining - spent, 0);
        return {
          date,
          actualRemaining: remaining,
          isVirtual: false,
        };
      }
    });
  }, [actualTimeline, dailyMinutes, targetMinutes, virtualOrigin]);

  const maxMinutes = Math.max(targetMinutes, 1);

  // Convert data points to SVG coordinates
  const chartWidth = 160;
  const chartHeight = 100;
  const marginLeft = 35;
  const marginBottom = 20;
  const marginTop = 10;

  const idealPoints = idealData.map((point) => {
    const x = marginLeft + (point.index / Math.max(idealData.length - 1, 1)) * chartWidth;
    const y = marginTop + ((maxMinutes - point.idealRemaining) / maxMinutes) * chartHeight;
    return { x, y, date: point.date };
  });

  const actualPoints = actualData.map((point) => {
    // Find matching index in idealData for proper x-coordinate alignment
    const matchingIndex = idealData.findIndex(ideal => ideal.date === point.date);
    const x = marginLeft + (matchingIndex / Math.max(idealData.length - 1, 1)) * chartWidth;
    const y = marginTop + ((maxMinutes - point.actualRemaining) / maxMinutes) * chartHeight;
    return { x, y, date: point.date, remaining: point.actualRemaining, isVirtual: point.isVirtual };
  });

  // Select date labels to show (excluding virtual origin, from creation to deadline)
  const realIdealPoints = idealPoints.filter((point) => !idealData[idealPoints.indexOf(point)]?.isVirtual);

  // Show date labels based on total count
  let dateLabels;
  if (realIdealPoints.length <= 8) {
    // Show all dates if 8 or fewer days
    dateLabels = realIdealPoints;
  } else if (realIdealPoints.length <= 15) {
    // Show every other date for medium ranges
    dateLabels = realIdealPoints.filter((_, i) => i % 2 === 0 || i === realIdealPoints.length - 1);
  } else {
    // Show 5 strategic labels for long ranges
    const indices = [
      0,
      Math.floor(realIdealPoints.length * 0.25),
      Math.floor(realIdealPoints.length * 0.5),
      Math.floor(realIdealPoints.length * 0.75),
      realIdealPoints.length - 1
    ];
    dateLabels = indices.map(i => realIdealPoints[i]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Burn-down Chart</p>
            <h3 className="text-xl font-semibold text-white">{task.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          {loading ? (
            <p className="text-sm text-gray-400">Loading chart...</p>
          ) : (
            <div className="space-y-2">
              <svg viewBox="0 0 210 150" className="w-full h-64">
                {/* Y-axis */}
                <line
                  x1={marginLeft}
                  y1={marginTop}
                  x2={marginLeft}
                  y2={marginTop + chartHeight}
                  stroke="#475569"
                  strokeWidth="2"
                />

                {/* X-axis */}
                <line
                  x1={marginLeft}
                  y1={marginTop + chartHeight}
                  x2={marginLeft + chartWidth}
                  y2={marginTop + chartHeight}
                  stroke="#475569"
                  strokeWidth="2"
                />

                {/* Y-axis label */}
                <text
                  x="8"
                  y={marginTop + chartHeight / 2}
                  fontSize="8"
                  fill="#94a3b8"
                  textAnchor="middle"
                  transform={`rotate(-90, 8, ${marginTop + chartHeight / 2})`}
                >
                  Remaining (min)
                </text>

                {/* Y-axis ticks */}
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                  const value = Math.round(maxMinutes * (1 - fraction));
                  const y = marginTop + chartHeight * fraction;
                  return (
                    <g key={fraction}>
                      <line
                        x1={marginLeft - 3}
                        y1={y}
                        x2={marginLeft}
                        y2={y}
                        stroke="#64748b"
                        strokeWidth="1"
                      />
                      <text x={marginLeft - 6} y={y + 3} fontSize="8" fill="#94a3b8" textAnchor="end">
                        {value}
                      </text>
                    </g>
                  );
                })}

                {/* Ideal burn-down line (dashed diagonal) */}
                {idealPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    points={idealPoints.map((point) => `${point.x},${point.y}`).join(' ')}
                  />
                )}

                {/* Actual burn-down line (solid, only up to today) */}
                {actualPoints.length > 0 && (
                  <polyline
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="3"
                    points={actualPoints.map((point) => `${point.x},${point.y}`).join(' ')}
                  />
                )}

                {/* Actual data points (skip virtual day) */}
                {actualPoints.map((point, idx) =>
                  !point.isVirtual ? (
                    <circle key={idx} cx={point.x} cy={point.y} r="3" fill="#60a5fa" />
                  ) : null
                )}

                {/* X-axis date labels */}
                {dateLabels.map((point) => (
                  <text
                    key={point.date}
                    x={point.x}
                    y={marginTop + chartHeight + 14}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#94a3b8"
                  >
                    {point.date.slice(5)}
                  </text>
                ))}
              </svg>

              <div className="flex items-center justify-center gap-6 text-xs mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-gray-500 opacity-60" style={{ borderTop: '2px dashed #64748b' }} />
                  <span className="text-gray-400">Ideal Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-emerald-400" />
                  <span className="text-gray-400">Actual Progress</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Estimated</p>
            <p className="text-lg font-semibold text-blue-400">{targetMinutes} min</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-lg font-semibold text-emerald-400">
              {task.completed_minutes || 0} min
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Remaining</p>
            <p className="text-lg font-semibold text-yellow-400">
              {actualData.length > 0
                ? actualData[actualData.length - 1].actualRemaining
                : targetMinutes}{' '}
              min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
