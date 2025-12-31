import { useEffect, useMemo, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import type { Task } from '../../types';
import type { ActivePomodoro } from './PomodoroModal';

interface ActivePomodoroCardProps {
  task: Task;
  activeSession: ActivePomodoro;
  onClick: () => void;
}

export default function ActivePomodoroCard({
  task,
  activeSession,
  onClick,
}: ActivePomodoroCardProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Check if session is paused
    if (activeSession.is_paused && activeSession.paused_seconds_remaining !== undefined) {
      setSecondsLeft(activeSession.paused_seconds_remaining);
      setIsRunning(false);
    } else {
      // Calculate remaining time from ends_at
      const sessionEnd = new Date(activeSession.ends_at);
      const remainingSeconds = Math.max(
        Math.round((sessionEnd.getTime() - Date.now()) / 1000),
        0
      );
      setSecondsLeft(remainingSeconds);
      setIsRunning(remainingSeconds > 0);
    }
  }, [activeSession]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);

          // Show browser notification when timer finishes
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Pomodoro Complete!', {
              body: `Great job! You finished your ${activeSession.duration_minutes} minute session for "${task.title}"`,
              icon: '/favicon.png',
              tag: 'pomodoro-complete',
              requireInteraction: true,
            });
            notification.onclick = () => {
              window.focus();
            };
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, activeSession.duration_minutes, task.title]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [secondsLeft]);

  const progress = useMemo(() => {
    const totalSeconds = activeSession.duration_minutes * 60;
    return ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  }, [secondsLeft, activeSession.duration_minutes]);

  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/40 rounded-xl p-4 hover:border-purple-500/60 transition-all shadow-lg backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Icon and Task Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
            {isRunning ? (
              <Play size={20} className="text-purple-300 fill-purple-300" />
            ) : (
              <Pause size={20} className="text-purple-300" />
            )}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs text-purple-300 font-semibold uppercase tracking-wide">
              Pomodoro Active
            </p>
            <p className="text-sm md:text-base font-semibold text-white truncate">
              {task.title}
            </p>
          </div>
        </div>

        {/* Right: Timer */}
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl md:text-3xl font-bold text-white tabular-nums">
            {formattedTime}
          </div>
          <p className="text-xs text-purple-300">
            {activeSession.is_paused ? 'Paused' : 'In Progress'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-slate-900/50 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </button>
  );
}
