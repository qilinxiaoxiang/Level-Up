import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';
import {
  getEndOfDayUTCFromDateString,
  getLocalDateString,
  getLocalWeekStart,
  getStartOfDayUTCFromDateString,
} from '../../utils/dateUtils';

interface WeeklyHistogramModalProps {
  onClose: () => void;
}

function addDaysToDateString(dateString: string, daysToAdd: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const baseUtc = Date.UTC(year, month - 1, day);
  const next = new Date(baseUtc + daysToAdd * 24 * 60 * 60 * 1000);
  const nextYear = next.getUTCFullYear();
  const nextMonth = String(next.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(next.getUTCDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function buildWeekDays(startDate: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysToDateString(startDate, index));
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default function WeeklyHistogramModal({ onClose }: WeeklyHistogramModalProps) {
  const { user, profile } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [lastWeekTotals, setLastWeekTotals] = useState<number[]>([]);
  const [thisWeekTotals, setThisWeekTotals] = useState<number[]>([]);

  const thisWeekStart = useMemo(
    () => getLocalWeekStart(),
    [profile?.daily_reset_time, profile?.timezone_offset_minutes]
  );
  const lastWeekStart = useMemo(
    () => addDaysToDateString(thisWeekStart, -7),
    [thisWeekStart]
  );
  const thisWeekDays = useMemo(() => buildWeekDays(thisWeekStart), [thisWeekStart]);
  const lastWeekDays = useMemo(() => buildWeekDays(lastWeekStart), [lastWeekStart]);
  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    const fetchWeekData = async () => {
      if (!user || !profile) return;
      setLoading(true);

      try {
        const rangeStart = getStartOfDayUTCFromDateString(lastWeekStart);
        const rangeEnd = getEndOfDayUTCFromDateString(thisWeekDays[6]);

        const { data, error } = await supabase
          .from('pomodoros')
          .select('duration_minutes, completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', rangeStart)
          .lte('completed_at', rangeEnd);

        if (error) throw error;

        const totalsMap = new Map<string, number>();
        [...lastWeekDays, ...thisWeekDays].forEach((day) => totalsMap.set(day, 0));

        (data || []).forEach((row) => {
          if (!row.completed_at) return;
          const dayKey = getLocalDateString(new Date(row.completed_at));
          if (!totalsMap.has(dayKey)) return;
          const nextTotal = (totalsMap.get(dayKey) || 0) + (row.duration_minutes || 0);
          totalsMap.set(dayKey, nextTotal);
        });

        setLastWeekTotals(lastWeekDays.map((day) => totalsMap.get(day) || 0));
        setThisWeekTotals(thisWeekDays.map((day) => totalsMap.get(day) || 0));
      } catch (err) {
        console.error('Failed to fetch weekly histogram data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekData();
  }, [user, profile, lastWeekStart, thisWeekDays, lastWeekDays]);

  const renderHistogram = (title: string, values: number[]) => {
    const maxValue = Math.max(1, ...values);
    const midValue = Math.round(maxValue / 2);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
          <span className="text-xs text-gray-500">
            Total {formatMinutes(values.reduce((sum, value) => sum + value, 0))}
          </span>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col justify-between text-[10px] text-gray-500 h-28">
            <span>{formatMinutes(maxValue)}</span>
            <span>{formatMinutes(midValue)}</span>
            <span>0</span>
          </div>
          <div className="relative flex-1 h-28">
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="border-t border-slate-700/60" />
              <div className="border-t border-slate-700/40" />
              <div className="border-t border-slate-700/40" />
              <div className="border-t border-slate-700/60" />
            </div>
            <div className="relative flex items-end gap-2 h-28">
              {values.map((value, index) => (
                <div key={`${title}-${index}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-24 flex items-end">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-blue-500/80 to-cyan-300/80"
                      style={{ height: `${Math.max((value / maxValue) * 100, 6)}%` }}
                      title={`${weekLabels[index]}: ${formatMinutes(value)}`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{weekLabels[index]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Weekly Breakdown</p>
            <h3 className="text-lg font-semibold text-white">Last Week vs This Week</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading weekly stats...</p>
        ) : (
          <div className="space-y-6">
            {renderHistogram('Last week', lastWeekTotals)}
            {renderHistogram('This week', thisWeekTotals)}
          </div>
        )}
      </div>
    </div>
  );
}
