import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';
import { Clock, Calendar } from 'lucide-react';
import { getStartOfDayUTC, getEndOfDayUTC } from '../../utils/dateUtils';

export default function TimeSummary() {
  const { user } = useUserStore();
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTimeSummary = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch today's pomodoros (using UTC timestamps for proper timezone handling)
        const { data: todayData } = await supabase
          .from('pomodoros')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('completed_at', getStartOfDayUTC())
          .lte('completed_at', getEndOfDayUTC());

        if (todayData) {
          const total = todayData.reduce((sum, p) => sum + (p.duration_minutes || 0), 0);
          setTodayMinutes(total);
        }

        // Fetch this week's pomodoros
        const weekStartDate = new Date();
        const dayOfWeek = weekStartDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStartDate.setDate(weekStartDate.getDate() + diff);

        const { data: weekData } = await supabase
          .from('pomodoros')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('completed_at', getStartOfDayUTC(weekStartDate));

        if (weekData) {
          const total = weekData.reduce((sum, p) => sum + (p.duration_minutes || 0), 0);
          setWeekMinutes(total);
        }
      } catch (error) {
        console.error('Failed to fetch time summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSummary();
  }, [user]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-800 rounded-lg p-4 border border-purple-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Today</p>
            {loading ? (
              <p className="text-2xl font-bold text-gray-500">...</p>
            ) : (
              <p className="text-2xl font-bold text-blue-400">{formatTime(todayMinutes)}</p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">
              {Math.floor(todayMinutes / 25)} Pomodoros
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 border border-purple-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide">This Week</p>
            {loading ? (
              <p className="text-2xl font-bold text-gray-500">...</p>
            ) : (
              <p className="text-2xl font-bold text-purple-400">{formatTime(weekMinutes)}</p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">
              {Math.floor(weekMinutes / 25)} Pomodoros
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
