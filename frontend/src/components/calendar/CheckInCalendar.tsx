import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';
import MakeUpDialog from './MakeUpDialog';
import TodayPomodorosModal from '../dashboard/TodayPomodorosModal';
import { getLocalDateString } from '../../utils/dateUtils';

interface CheckInCalendarProps {
  streak: number;
  restCredits: number;
  onClose: () => void;
}

export default function CheckInCalendar({ streak, restCredits, onClose }: CheckInCalendarProps) {
  const { user, fetchProfile } = useUserStore();
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewingDate, setViewingDate] = useState(new Date());
  const [showPomodorosModal, setShowPomodorosModal] = useState(false);
  const [selectedDateForPomodoros, setSelectedDateForPomodoros] = useState<string | null>(null);

  const year = viewingDate.getFullYear();
  const monthIndex = viewingDate.getMonth();
  const month = viewingDate.toLocaleString('default', { month: 'long' });

  const startOfMonth = useMemo(() => new Date(year, monthIndex, 1), [year, monthIndex]);
  const endOfMonth = useMemo(() => new Date(year, monthIndex + 1, 0), [year, monthIndex]);

  const days = useMemo(() => {
    const daysArray: Date[] = [];
    const cursor = new Date(startOfMonth);
    while (cursor <= endOfMonth) {
      daysArray.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return daysArray;
  }, [startOfMonth, endOfMonth]);

  useEffect(() => {
    const fetchCompletions = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', getLocalDateString(startOfMonth))
        .lte('date', getLocalDateString(endOfMonth));

      if (!error && data) {
        const map: Record<string, boolean> = {};
        data.forEach((row) => {
          map[row.date] = true;
        });
        setCompletions(map);
      }
      setLoading(false);
    };

    fetchCompletions();
  }, [user, startOfMonth, endOfMonth]);

  const handleMakeUp = async (date: string) => {
    if (!user || restCredits <= 0) return;

    // Insert or update check-in record
    await supabase
      .from('daily_check_ins')
      .upsert(
        {
          user_id: user.id,
          date,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      );

    await supabase
      .from('user_profiles')
      .update({ rest_credits: restCredits - 1 })
      .eq('id', user.id);

    setCompletions((prev) => ({ ...prev, [date]: true }));
    fetchProfile();
    setSelectedDate(null);
  };

  const goToPreviousMonth = () => {
    setViewingDate(new Date(year, monthIndex - 1, 1));
  };

  const goToNextMonth = () => {
    setViewingDate(new Date(year, monthIndex + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = getLocalDateString(date);
    setSelectedDateForPomodoros(dateStr);
    setShowPomodorosModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Check-In Calendar</p>
              <h3 className="text-xl font-semibold text-white">
                {month} {year}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-1 text-gray-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1 text-gray-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={20} />
              </button>
            </div>
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
          <p className="text-sm text-gray-400">Loading calendar...</p>
        ) : (
          <div className="grid grid-cols-7 gap-2 text-xs text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label) => (
              <div key={label} className="text-gray-500">
                {label}
              </div>
            ))}
            {Array.from({ length: startOfMonth.getDay() }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}
            {days.map((date) => {
              const dateKey = getLocalDateString(date);
              const isFuture = date > today;
              const isCompleted = completions[dateKey];
              const isMissed = !isFuture && !isCompleted;

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={isFuture}
                  onClick={() => {
                    if (isMissed) {
                      setSelectedDate(dateKey);
                    } else if (!isFuture) {
                      handleDateClick(date);
                    }
                  }}
                  className={`h-8 rounded-lg border text-xs font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/30 cursor-pointer'
                      : isMissed
                      ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20 cursor-pointer'
                      : 'bg-slate-800 text-gray-400 border-slate-700'
                  } ${isFuture ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="text-xs text-gray-500">Current streak</p>
            <p>{streak} days</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Rest credits</p>
            <p>{restCredits}</p>
          </div>
        </div>
      </div>

      {selectedDate && (
        <MakeUpDialog
          date={selectedDate}
          restCredits={restCredits}
          onClose={() => setSelectedDate(null)}
          onConfirm={() => handleMakeUp(selectedDate)}
        />
      )}

      {showPomodorosModal && selectedDateForPomodoros && user && (
        <TodayPomodorosModal
          isOpen={showPomodorosModal}
          onClose={() => {
            setShowPomodorosModal(false);
            setSelectedDateForPomodoros(null);
          }}
          userId={user.id}
          timezone={user.timezone_name || 'UTC'}
          specificDate={selectedDateForPomodoros}
        />
      )}
    </div>
  );
}
