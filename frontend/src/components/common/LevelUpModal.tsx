interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-yellow-500/30 shadow-2xl p-6 text-center space-y-4">
        <div className="text-5xl">✨</div>
        <h2 className="text-3xl font-bold text-yellow-300">Level Up!</h2>
        <p className="text-gray-300">You reached level {level}.</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2 bg-yellow-500/90 hover:bg-yellow-500 text-slate-900 font-semibold rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
