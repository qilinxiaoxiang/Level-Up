interface StreakDisplayProps {
  currentStreak: number;
  restCredits: number;
  onOpenCalendar?: () => void;
}

export default function StreakDisplay({
  currentStreak,
  restCredits,
  onOpenCalendar,
}: StreakDisplayProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-purple-500/20 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Streak</p>
          <p className="text-2xl font-semibold text-white">{currentStreak} days</p>
          <p className="text-xs text-gray-500 mt-1">Rest credits: {restCredits}</p>
        </div>
        <div className="text-3xl">🔥</div>
      </div>
      <button
        type="button"
        onClick={onOpenCalendar}
        className="mt-3 w-full px-3 py-2 bg-slate-900 hover:bg-slate-700 text-gray-200 text-xs font-semibold rounded-lg transition-colors"
      >
        Check-In Calendar
      </button>
    </div>
  );
}
