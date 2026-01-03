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
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    // Check if session is paused
    if (activeSession.is_paused && activeSession.paused_seconds_remaining !== undefined) {
      const remaining = activeSession.paused_seconds_remaining;
      if (remaining < 0) {
        setSecondsLeft(0);
        setOvertimeSeconds(Math.abs(remaining));
        setIsOvertime(true);
      } else {
        setSecondsLeft(remaining);
        setOvertimeSeconds(activeSession.overtime_seconds || 0);
        setIsOvertime(false);
      }
      setIsRunning(false);
    } else {
      // Calculate remaining time from ends_at
      const sessionEnd = new Date(activeSession.ends_at);
      const remainingSeconds = Math.round((sessionEnd.getTime() - Date.now()) / 1000);

      if (remainingSeconds < 0) {
        // In overtime
        setSecondsLeft(0);
        setOvertimeSeconds(Math.abs(remainingSeconds));
        setIsOvertime(true);
        setIsRunning(true);
      } else {
        setSecondsLeft(remainingSeconds);
        setOvertimeSeconds(0);
        setIsOvertime(false);
        setIsRunning(true);
      }
    }
  }, [activeSession]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      if (isOvertime) {
        // Continue counting overtime
        setOvertimeSeconds((prev) => prev + 1);
      } else {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Switch to overtime mode
            setIsOvertime(true);
            setOvertimeSeconds(0);

            // Show browser notification when timer finishes
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification('Pomodoro Time Up!', {
                body: `Timer finished for "${task.title}". Click to complete or continue working.`,
                icon: '/favicon.png',
                tag: 'pomodoro-complete',
                requireInteraction: true,
              });
              notification.onclick = () => {
                window.focus();
                onClick();
              };
            }

            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, isOvertime, task.title, onClick]);

  const formattedTime = useMemo(() => {
    if (isOvertime) {
      const minutes = Math.floor(overtimeSeconds / 60);
      const seconds = overtimeSeconds % 60;
      return `+${minutes}:${String(seconds).padStart(2, '0')}`;
    } else {
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
  }, [secondsLeft, overtimeSeconds, isOvertime]);

  const progress = useMemo(() => {
    const totalSeconds = activeSession.duration_minutes * 60;
    if (isOvertime) {
      return 100; // Full progress in overtime
    }
    return ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  }, [secondsLeft, isOvertime, activeSession.duration_minutes]);

  return (
    <button
      onClick={onClick}
      className={`w-full border-2 rounded-xl p-4 transition-all shadow-lg backdrop-blur-sm ${
        isOvertime
          ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/40 hover:border-orange-500/60 animate-pulse'
          : 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/40 hover:border-purple-500/60'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Icon and Task Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isOvertime ? 'bg-orange-500/30' : 'bg-purple-500/30'
            }`}
          >
            {isRunning ? (
              <Play
                size={20}
                className={isOvertime ? 'text-orange-300 fill-orange-300' : 'text-purple-300 fill-purple-300'}
              />
            ) : (
              <Pause size={20} className={isOvertime ? 'text-orange-300' : 'text-purple-300'} />
            )}
          </div>
          <div className="min-w-0 text-left">
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                isOvertime ? 'text-orange-300' : 'text-purple-300'
              }`}
            >
              {isOvertime ? 'Overtime' : 'Pomodoro Active'}
            </p>
            <p className="text-sm md:text-base font-semibold text-white truncate">
              {task.title}
            </p>
          </div>
        </div>

        {/* Right: Timer */}
        <div className="flex-shrink-0 text-right">
          <div className={`text-2xl md:text-3xl font-bold tabular-nums ${
            isOvertime ? 'text-orange-400' : 'text-white'
          }`}>
            {formattedTime}
          </div>
          <p className={`text-xs ${isOvertime ? 'text-orange-300' : 'text-purple-300'}`}>
            {activeSession.is_paused ? 'Paused' : isOvertime ? 'Extra Time' : 'In Progress'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-slate-900/50 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${
            isOvertime
              ? 'bg-gradient-to-r from-orange-500 to-red-500'
              : 'bg-gradient-to-r from-purple-500 to-pink-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </button>
  );
}
