interface MakeUpDialogProps {
  date: string;
  restCredits: number;
  onClose: () => void;
  onConfirm: () => void;
}

export default function MakeUpDialog({ date, restCredits, onClose, onConfirm }: MakeUpDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Make Up Day</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-300">
          Use 1 rest credit to mark {date} as completed.
        </p>
        <p className="text-xs text-gray-500">Rest credits available: {restCredits}</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-slate-800 text-gray-300 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={restCredits <= 0}
            className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
