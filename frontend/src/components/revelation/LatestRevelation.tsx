import { useEffect, useState } from 'react';
import { Sparkles, History, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database';
import type { AILevel } from '../../utils/revelationPrompts';

interface LatestRevelationProps {
  onViewHistory: () => void;
  onSeekRevelation: (level?: AILevel) => void;
  refreshTrigger?: number;
}

type Revelation = Database['public']['Tables']['revelations']['Row'];

export default function LatestRevelation({ onViewHistory, onSeekRevelation, refreshTrigger }: LatestRevelationProps) {
  const [revelation, setRevelation] = useState<Revelation | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const suggestionTypes = ['revelation_level1', 'revelation_level2', 'revelation_level3', 'revelation'];

  useEffect(() => {
    fetchLatestRevelation();
  }, [refreshTrigger]);

  const fetchLatestRevelation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('revelations')
        .select('*')
        .in('suggestion_type', suggestionTypes)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest revelation:', error);
        return;
      }

      setRevelation(data?.[0] || null);
      setExpanded(true); // Auto-expand new revelations
    } catch (err) {
      console.error('Failed to fetch revelation:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseRevelationSections = (text: string) => {
    const sections: { title: string; content: string }[] = [];
    const lines = text.split('\n');
    let currentSection: { title: string; content: string } | null = null;

    for (const line of lines) {
      // Check for markdown headers (## Title)
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

      // Bold text (e.g., **IMPORTANT**)
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={idx} className="text-pink-300 font-semibold mb-2 text-base">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }

      // List items with sub-items
      if (trimmed.startsWith('- ')) {
        const listContent = normalized.substring(2);
        // Check for bold sections within list items
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
        <p key={idx} className="text-gray-200 mb-2 text-base leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/10 to-slate-800/50 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-center gap-2 text-purple-400">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm">Loading revelation...</span>
        </div>
      </div>
    );
  }

  if (!revelation) {
    // Show "Seek Revelation" button when no revelations exist
    return (
      <button
        onClick={() => onSeekRevelation()}
        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white rounded-xl p-5 shadow-2xl transition-all transform hover:scale-[1.01] border border-purple-400/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={28} className="text-yellow-300 animate-pulse" />
            <div className="text-left">
              <h3 className="text-xl font-bold">Seek Revelation</h3>
              <p className="text-purple-100 text-xs mt-0.5">
                Divine clarity for your journey awaits...
              </p>
            </div>
          </div>
          <Sparkles size={20} className="text-pink-300" />
        </div>
      </button>
    );
  }

  const sections = parseRevelationSections(revelation.revelation_text);
  const previewSection = sections[0]; // Show first section in collapsed view

  return (
    <div className="bg-gradient-to-br from-slate-800/50 via-purple-900/10 to-slate-800/50 border border-purple-500/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-purple-900/10 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Sparkles className="text-purple-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Revelation
            </h3>
            <p className="text-xs text-gray-400">
              {new Date(revelation.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSeekRevelation();
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">Seek</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory();
            }}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <History size={16} />
          </button>
          {expanded ? (
            <ChevronUp className="text-gray-400" size={20} />
          ) : (
            <ChevronDown className="text-gray-400" size={20} />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded ? (
        <div className="px-6 pb-6 space-y-6">
          {sections.map((section, idx) => {
            const isSeedAction = section.title.toLowerCase() === 'seed action';
            return (
              <div key={idx} className="space-y-3">
                <h4 className="text-xl font-semibold text-purple-300 flex items-center gap-2">
                  {section.title}
                </h4>
                <div
                  className={isSeedAction
                    ? 'rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 space-y-1'
                    : 'pl-2 space-y-1'}
                >
                  {renderMarkdownContent(section.content)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 pb-4">
          {previewSection && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-purple-300">{previewSection.title}</h4>
              <div className="text-gray-400 text-sm line-clamp-2">
                {previewSection.content.substring(0, 150)}...
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">Click to expand</p>
        </div>
      )}
    </div>
  );
}
