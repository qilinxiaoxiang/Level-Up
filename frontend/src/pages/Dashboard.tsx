import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGoals } from '../hooks/useGoals';
import RevelationModal from '../components/revelation/RevelationModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { goals, hasAllGoals, loading: goalsLoading } = useGoals();
  const [showRevelation, setShowRevelation] = useState(false);

  // Redirect to goals page if user doesn't have all goals set
  useEffect(() => {
    if (!goalsLoading && !hasAllGoals) {
      navigate('/goals');
    }
  }, [goalsLoading, hasAllGoals, navigate]);

  // Show loading while checking goals
  if (goalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
              ⚔️ Level Up
            </h1>
            <p className="text-gray-400 mt-1">Your Productivity RPG</p>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg border border-slate-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Character Stats Card */}
        <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/20 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Character Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Level</p>
              <p className="text-3xl font-bold text-yellow-400">{profile?.level || 1}</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">HP</p>
              <p className="text-3xl font-bold text-red-400">
                {profile?.current_hp || 100}/{profile?.max_hp || 100}
              </p>
            </div>
          </div>

          {/* HP Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Health</span>
              <span>{profile?.current_hp || 100}/{profile?.max_hp || 100}</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all"
                style={{
                  width: `${((profile?.current_hp || 100) / (profile?.max_hp || 100)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Revelation Feature - Prominent CTA */}
        <div className="mb-8">
          <button
            onClick={() => setShowRevelation(true)}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white rounded-xl p-6 shadow-2xl transition-all transform hover:scale-[1.02] border border-purple-400/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Sparkles size={32} className="text-yellow-300 animate-pulse" />
                <div className="text-left">
                  <h3 className="text-2xl font-bold">Seek Revelation</h3>
                  <p className="text-purple-100 text-sm mt-1">
                    Divine clarity for your journey awaits...
                  </p>
                </div>
              </div>
              <Sparkles size={24} className="text-pink-300" />
            </div>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Current Streak</p>
                <p className="text-3xl font-bold text-orange-400">{profile?.current_streak || 0} days</p>
              </div>
              <span className="text-4xl">🔥</span>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Pomodoros</p>
                <p className="text-3xl font-bold text-purple-400">{profile?.total_pomodoros || 0}</p>
              </div>
              <span className="text-4xl">⏱️</span>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Rest Credits</p>
                <p className="text-3xl font-bold text-green-400">{profile?.rest_credits || 0}</p>
              </div>
              <span className="text-4xl">💤</span>
            </div>
          </div>
        </div>

        {/* Goals Summary */}
        <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/20 shadow-lg mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Your Goals</h2>
            <button
              onClick={() => navigate('/goals')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
            >
              Goals & Tasks
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.length > 0 ? (
              goals.map((goal) => (
                <div key={goal.id} className="bg-slate-900 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">
                      {goal.goal_type === '3year' ? '🎯' : goal.goal_type === '1year' ? '📅' : '🚀'}
                    </span>
                    <span className="text-xs text-gray-400 uppercase">
                      {goal.goal_type === '3year' ? '3-Year' : goal.goal_type === '1year' ? '1-Year' : '1-Month'}
                    </span>
                  </div>
                  <p className="text-white font-medium line-clamp-2">{goal.description}</p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-400 py-4">
                No goals set yet. Click "View All Goals" to get started!
              </div>
            )}
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-slate-800 rounded-lg p-8 border border-purple-500/20 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Your Adventure Begins Soon!</h3>
          <p className="text-gray-400">Tasks and battles are coming in the next phase.</p>
        </div>
      </div>

      {/* Revelation Modal */}
      {showRevelation && <RevelationModal onClose={() => setShowRevelation(false)} />}
    </div>
  );
}
