import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useRevelation } from '../../hooks/useRevelation';

interface RevelationModalProps {
  onClose: () => void;
}

export default function RevelationModal({ onClose }: RevelationModalProps) {
  const [userMessage, setUserMessage] = useState('');
  const { revelation, loading, error, getRevelation } = useRevelation();

  const handleGetRevelation = async () => {
    await getRevelation(userMessage || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-3xl bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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

        {/* User Input (Optional) */}
        {!revelation && (
          <div className="space-y-3">
            <label className="block text-sm text-gray-300">
              Share your thoughts (optional)
            </label>
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="e.g., 'Feeling tired today', 'Need to finish project X', 'Want to focus on creative work'..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              rows={3}
            />
          </div>
        )}

        {/* Revelation Display */}
        {revelation && (
          <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6 space-y-4">
            <div className="prose prose-invert prose-sm max-w-none">
              {revelation.split('\n').map((paragraph, idx) => (
                paragraph.trim() && (
                  <p key={idx} className="text-gray-200 leading-relaxed mb-3">
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
            <>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Get New Revelation
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </>
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
                onClick={handleGetRevelation}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Seeking Revelation...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Seek Revelation
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
