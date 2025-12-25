import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types';

interface BurnDownModalProps {
  task: Task;
  onClose: () => void;
}

export default function BurnDownModal({ task, onClose }: BurnDownModalProps) {
  const [dailyMinutes, setDailyMinutes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const targetMinutes =
    task.estimated_minutes ?? (task.estimated_pomodoros ? task.estimated_pomodoros * 25 : 0);

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
          const date = row.completed_at?.slice(0, 10) ?? '';
          if (!date) return;
          map[date] = (map[date] || 0) + (row.duration_minutes || 0);
        });
        setDailyMinutes(map);
      }
      setLoading(false);
    };

    fetchPomodoros();
  }, [task.id]);

  const timeline = useMemo(() => {
    const dates = Object.keys(dailyMinutes).sort();
    if (dates.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      return [today];
    }

    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    const days: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [dailyMinutes]);

  const points = useMemo(() => {
    let remaining = targetMinutes;
    return timeline.map((date, index) => {
      const spent = dailyMinutes[date] || 0;
      remaining = Math.max(remaining - spent, 0);
      return { date, remaining, index };
    });
  }, [timeline, dailyMinutes, targetMinutes]);

  const maxMinutes = Math.max(targetMinutes, 1);
  const chartPoints = points.map((point) => {
    const x = 20 + (point.index / Math.max(points.length - 1, 1)) * 160;
    const y = 110 - (point.remaining / maxMinutes) * 100;
    return { x, y, date: point.date, remaining: point.remaining };
  });

  const dateLabels = chartPoints.filter((_, index) => {
    if (chartPoints.length <= 4) return true;
    return index === 0 || index === chartPoints.length - 1 || index === Math.floor(chartPoints.length / 2);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Burn-down</p>
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

        <div className="bg-slate-800 rounded-lg p-4">
          {loading ? (
            <p className="text-sm text-gray-400">Loading chart...</p>
          ) : (
            <svg viewBox="0 0 200 140" className="w-full h-44">
              <line x1="20" y1="10" x2="20" y2="110" stroke="#334155" strokeWidth="2" />
              <line x1="20" y1="110" x2="180" y2="110" stroke="#334155" strokeWidth="2" />
              {chartPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="3"
                  points={chartPoints.map((point) => `${point.x},${point.y}`).join(' ')}
                />
              )}
              {chartPoints.map((point, idx) => (
                <circle key={idx} cx={point.x} cy={point.y} r="3" fill="#60a5fa" />
              ))}
              {dateLabels.map((point) => (
                <text
                  key={point.date}
                  x={point.x}
                  y="128"
                  textAnchor="middle"
                  fontSize="8"
                  fill="#94a3b8"
                >
                  {point.date.slice(5)}
                </text>
              ))}
            </svg>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="text-xs text-gray-500">Target</p>
            <p>{targetMinutes} min</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Remaining</p>
            <p>{points.length ? points[points.length - 1].remaining : targetMinutes} min</p>
          </div>
        </div>
      </div>
    </div>
  );
}
