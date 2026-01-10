import { useState } from 'react';
import { X, Sparkles, Loader2, Calendar, TrendingUp, Zap } from 'lucide-react';
import { useRevelation } from '../../hooks/useRevelation';
import type { AILevel } from '../../utils/revelationPrompts';

interface RevelationModalProps {
  onClose: () => void;
  onRevelationReceived?: () => void;
}

export default function RevelationModal({ onClose, onRevelationReceived }: RevelationModalProps) {
  const [userMessage, setUserMessage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<AILevel>(1);
  const { revelation, loading, error, getRevelation } = useRevelation();

  const handleGetRevelation = async (level: AILevel) => {
    await getRevelation(userMessage || undefined, level);
    onRevelationReceived?.();
  };

  const levelConfig = {
    1: {
      icon: Calendar,
      title: 'Personal Assistant',
      subtitle: 'Organize & Schedule',
      description: 'Get a clear daily plan with prioritized tasks and time blocks',
      color: 'blue',
      gradient: 'from-blue-600 to-cyan-600',
      hoverGradient: 'from-blue-700 to-cyan-700',
      bgGradient: 'from-blue-500/20 to-cyan-500/10',
      borderColor: 'border-blue-500/40',
    },
    2: {
      icon: TrendingUp,
      title: 'Growth Coach',
      subtitle: 'Align & Refine',
      description: 'Strategic analysis of goal alignment and task effectiveness',
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600',
      hoverGradient: 'from-purple-700 to-pink-700',
      bgGradient: 'from-purple-500/20 to-pink-500/10',
      borderColor: 'border-purple-500/40',
    },
    3: {
      icon: Zap,
      title: 'Revelation',
      subtitle: 'Meaning & Purpose',
      description: 'Deep existential guidance when direction feels unclear',
      color: 'amber',
      gradient: 'from-amber-600 to-orange-600',
      hoverGradient: 'from-amber-700 to-orange-700',
      bgGradient: 'from-amber-500/20 to-orange-500/10',
      borderColor: 'border-amber-500/40',
    },
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black sm:px-4">
      <div className="w-full h-full sm:h-auto sm:max-w-3xl bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900 sm:rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-4 sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-400" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Revelation
              </h2>
              <p className="text-xs text-gray-400">Divine Clarity for Your Journey</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Level Selection */}
        {!revelation && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Choose AI Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([1, 2, 3] as AILevel[]).map((level) => {
                  const config = levelConfig[level];
                  const Icon = config.icon;
                  const isSelected = selectedLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedLevel(level)}
                      disabled={loading}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? `border-${config.color}-500 bg-gradient-to-br ${config.bgGradient}`
                          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? `bg-gradient-to-br ${config.gradient}` : 'bg-slate-700'}`}>
                          <Icon size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-white text-sm">{config.title}</div>
                          <div className={`text-xs ${isSelected ? `text-${config.color}-300` : 'text-gray-400'}`}>
                            {config.subtitle}
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                        {config.description}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className={`w-2 h-2 rounded-full bg-${config.color}-400 animate-pulse`} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Input (Optional) */}
            <div className="space-y-3">
              <label className="block text-sm text-gray-300">
                Share your thoughts (optional)
              </label>
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="e.g., 'Feeling tired today', 'Need to finish project X', 'Want to focus on creative work'..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 text-base focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-60"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-4">
            <div className="relative w-full max-w-md text-center">
              <div className="absolute inset-0 -z-10 rounded-full blur-3xl bg-gradient-to-br from-amber-200/30 via-purple-500/40 to-indigo-500/30 scale-150" />
              <div className="absolute inset-0 -z-20 animate-pulse rounded-full bg-amber-300/10 blur-2xl" />
              <div className="border border-purple-400/30 bg-gradient-to-br from-slate-900/80 via-purple-900/50 to-slate-900/80 rounded-2xl p-8 space-y-4 shadow-2xl">
                <div className="flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full border border-amber-200/40 bg-amber-200/10 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                    <Loader2 className="animate-spin text-amber-200" size={26} />
                  </div>
                </div>
                <p className="text-amber-200 text-xs tracking-[0.4em] uppercase">Revelation Ritual</p>
                <p className="text-gray-100 text-base">
                  The revelation speaks through the veil. Stay still and receive the light.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors"
                >
                  Cancel Ritual
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revelation Display */}
        {revelation && (
          <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6 space-y-4">
            <div className="prose prose-invert max-w-none">
              {revelation.split('\n').map((paragraph, idx) => (
                paragraph.trim() && (
                  <p key={idx} className="text-gray-200 text-base leading-relaxed mb-3">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {revelation ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGetRevelation(selectedLevel)}
                disabled={loading}
                className={`px-6 py-2 bg-gradient-to-r ${levelConfig[selectedLevel].gradient} hover:${levelConfig[selectedLevel].hoverGradient} text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Seeking Revelation...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Seek {levelConfig[selectedLevel].title}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
