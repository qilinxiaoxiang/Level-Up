import { useEffect, useState } from 'react';
import { X, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../types/database';

interface RevelationHistoryModalProps {
  onClose: () => void;
}

type Revelation = Tables<'revelations'>;

export default function RevelationHistoryModal({ onClose }: RevelationHistoryModalProps) {
  const [revelations, setRevelations] = useState<Revelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRevelations();
  }, []);

  const fetchRevelations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('revelations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching revelations:', error);
        return;
      }

      setRevelations(data || []);
      // Auto-expand the first (latest) revelation
      if (data && data.length > 0) {
        setExpandedId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch revelations:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseRevelationSections = (text: string) => {
    const sections: { title: string; content: string }[] = [];
    const lines = text.split('\n');
    let currentSection: { title: string; content: string } | null = null;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: line.replace('## ', '').trim(), content: '' };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const renderMarkdownContent = (content: string) => {
    const rawLines = content.split('\n');
    const mergedLines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();
      const prev = mergedLines[mergedLines.length - 1] || '';
      const prevTrimmed = prev.trim();
      const isTimeOnly =
        /^(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–]\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)$/i.test(trimmed);
      if (trimmed.startsWith(':') && prevTrimmed) {
        mergedLines[mergedLines.length - 1] = `${prevTrimmed}${trimmed}`;
        continue;
      }
      if (isTimeOnly && i + 1 < rawLines.length) {
        const next = rawLines[i + 1].trim();
        if (next && !next.startsWith('#') && !next.startsWith('- ') && !next.startsWith('* ')) {
          mergedLines.push(`${trimmed}: ${next}`);
          i += 1;
          continue;
        }
      }
      mergedLines.push(line);
    }

    return mergedLines.map((line, idx) => {
      const trimmed = line.trim();
      const normalized = trimmed.replace(/\*\*/g, '').replace(/^\*+/, '').trim();
      if (!trimmed) return null;

      // Schedule lines (e.g., "- 11:10 PM - 12:00 AM: Task Name")
      const scheduleMatch = normalized
        .replace(/^(?:-|\*|\d+[.)])\s*/, '')
        .match(/^(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–]\s*\d{1,2}:\d{2}\s*(?:AM|PM)?):\s*(.*)$/i);
      if (scheduleMatch) {
        const match = scheduleMatch;
        if (match) {
          const cleanedTask = match[2].replace(/\([^)]*min[^)]*\)/gi, '').trim();
          return (
            <div key={idx} className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-purple-300 font-semibold text-base">{match[1]}</span>
              <span className="text-gray-200 text-base leading-relaxed">{cleanedTask}</span>
            </div>
          );
        }
      }

      // Bold text
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={idx} className="text-pink-300 font-semibold mb-2 text-base">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }

      // List items
      if (trimmed.startsWith('- ')) {
        const listContent = normalized.substring(2);
        const rendered = listContent.replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300">$1</strong>');
        return (
          <li
            key={idx}
            className="text-gray-200 mb-1 ml-4 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        );
      }

      // Regular paragraphs
      return (
        <p key={idx} className="text-gray-200 mb-2 leading-relaxed text-base">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-4xl bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-400" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Revelation History
              </h2>
              <p className="text-xs text-gray-400">
                {revelations.length} {revelations.length === 1 ? 'revelation' : 'revelations'} received
              </p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-purple-400 py-12">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm">Loading revelations...</span>
            </div>
          ) : revelations.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="text-purple-400 mx-auto mb-4" size={48} />
              <p className="text-gray-400">No revelations yet. Seek your first revelation!</p>
            </div>
          ) : (
            revelations.map((revelation) => {
              const isExpanded = expandedId === revelation.id;
              const sections = parseRevelationSections(revelation.revelation_text);
              const previewSection = sections[0];

              return (
                <div
                  key={revelation.id}
                  className="bg-slate-800/50 border border-purple-500/20 rounded-xl overflow-hidden"
                >
                  {/* Revelation Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-purple-900/10 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : revelation.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-medium text-purple-300">
                          {new Date(revelation.created_at).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({revelation.provider})
                        </span>
                      </div>
                      {!isExpanded && revelation.context_snapshot && (
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          {(revelation.context_snapshot as any).streak && (
                            <span>Streak: {(revelation.context_snapshot as any).streak}</span>
                          )}
                          {(revelation.context_snapshot as any).timeOfDay && (
                            <span>Time: {(revelation.context_snapshot as any).timeOfDay}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={20} />
                    )}
                  </div>

                  {/* Revelation Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-6">
                      {/* Full Prompts - For Debugging */}
                      {revelation.context_snapshot && (revelation.context_snapshot as any).systemPrompt && (
                        <details className="bg-slate-900/50 border border-purple-500/10 rounded-lg">
                          <summary className="px-4 py-3 cursor-pointer text-base font-medium text-purple-300 hover:text-purple-200">
                            🐛 Debug: View Full Prompts Sent to LLM (Click to expand)
                          </summary>
                          <div className="px-4 pb-4 space-y-4">
                            <div>
                              <p className="text-sm text-gray-400 mb-2 font-bold">System Prompt:</p>
                              <pre className="text-sm text-gray-300 bg-slate-800 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                                {(revelation.context_snapshot as any).systemPrompt}
                              </pre>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 mb-2 font-bold">User Prompt (Full Context):</p>
                              <pre className="text-sm text-gray-300 bg-slate-800 p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {(revelation.context_snapshot as any).userPrompt}
                              </pre>
                            </div>
                          </div>
                        </details>
                      )}

                      {/* Context Summary */}
                      {revelation.context_snapshot && (
                        <div className="bg-slate-900/50 border border-purple-500/10 rounded-lg p-3">
                          <p className="text-sm text-gray-400 mb-2">Context summary:</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {(revelation.context_snapshot as any).streak !== undefined && (
                              <div>
                                <span className="text-gray-500">Streak: </span>
                                <span className="text-purple-300">{(revelation.context_snapshot as any).streak} days</span>
                              </div>
                            )}
                            {(revelation.context_snapshot as any).timeOfDay && (
                              <div>
                                <span className="text-gray-500">Time of Day: </span>
                                <span className="text-purple-300">{(revelation.context_snapshot as any).timeOfDay}</span>
                              </div>
                            )}
                            {(revelation.context_snapshot as any).tasksCompleted !== undefined && (
                              <div>
                                <span className="text-gray-500">Daily Tasks: </span>
                                <span className="text-purple-300">
                                  {(revelation.context_snapshot as any).tasksCompleted}/{(revelation.context_snapshot as any).totalDailyTasks} complete
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Revelation Sections */}
                      {sections.map((section, idx) => {
                        const isSeedAction = section.title.toLowerCase() === 'seed action';
                        return (
                          <div key={idx} className="space-y-2">
                            <h4 className="text-lg font-semibold text-purple-300">
                              {section.title}
                            </h4>
                            <div
                              className={isSeedAction
                                ? 'rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 space-y-1'
                                : 'pl-2'}
                            >
                              {renderMarkdownContent(section.content)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
