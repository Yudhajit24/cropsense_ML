/**
 * CommandPalette.tsx — Quick-access command palette triggered by CMD+K.
 *
 * Provides fuzzy‐filtered navigation between the three main tabs
 * (Recommend, Analytics, Assistant) and common actions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sprout, Activity, MessageSquare, Search } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  onNavigate: (tab: 'recommend' | 'analytics' | 'assistant') => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // CMD+K (Mac) / CTRL+K (Windows/Linux) toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'recommend',
      label: 'Crop Recommendation',
      description: 'Upload soil photo and get crop predictions',
      icon: <Sprout className="w-4 h-4" />,
      action: () => { onNavigate('recommend'); setIsOpen(false); },
    },
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      description: 'View model metrics and CNN performance',
      icon: <Activity className="w-4 h-4" />,
      action: () => { onNavigate('analytics'); setIsOpen(false); },
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      description: 'Chat with the LLaMA 3 farm advisor',
      icon: <MessageSquare className="w-4 h-4" />,
      action: () => { onNavigate('assistant'); setIsOpen(false); },
    },
  ];

  // Simple fuzzy filter
  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 bg-white border-2 border-black shadow-2xl">
        {/* Search input */}
        <div className="flex items-center border-b-2 border-black px-4 gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands…"
            className="w-full py-4 font-sans text-sm bg-transparent outline-none placeholder:text-gray-400"
          />
          <kbd className="font-mono text-[10px] border border-gray-300 px-1.5 py-0.5 text-gray-400 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-gray-400 font-sans text-sm">
              No matching commands
            </div>
          )}
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              onClick={cmd.action}
              className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-black hover:text-white transition-colors group"
            >
              <span className="text-gray-400 group-hover:text-white">{cmd.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-sans text-sm font-medium">{cmd.label}</div>
                <div className="font-sans text-[11px] text-gray-400 group-hover:text-gray-300 truncate">
                  {cmd.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
