
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppID, OSContextType, FileSystemFile } from '../types';

interface GlobalSearchProps {
  os: OSContextType;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'app' | 'file' | 'setting';
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ os, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const apps = useMemo(() => [
    { id: AppID.AGENT, label: 'Sarah AI Agent', icon: 'fa-robot', color: 'bg-purple-500' },
    { id: AppID.BROWSER, label: 'Web Browser', icon: 'fa-globe', color: 'bg-blue-500' },
    { id: AppID.YOUTUBE, label: 'YouTube Media', icon: 'fa-play', color: 'bg-red-600' },
    { id: AppID.GMAIL, label: 'Gmail Client', icon: 'fa-envelope', color: 'bg-indigo-600' },
    { id: AppID.NOTEPAD, label: 'Notepad Text Editor', icon: 'fa-file-signature', color: 'bg-amber-500' },
    { id: AppID.TERMINAL, label: 'Console Terminal', icon: 'fa-terminal', color: 'bg-emerald-600' },
    { id: AppID.SETTINGS, label: 'System Control Settings', icon: 'fa-sliders', color: 'bg-slate-500' },
    { id: AppID.ABOUT, label: 'About GeminiOS', icon: 'fa-circle-info', color: 'bg-blue-600' },
  ], []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const list: SearchResult[] = [];

    // Search Apps
    apps.forEach(app => {
      if (app.label.toLowerCase().includes(q)) {
        list.push({
          id: `app-${app.id}`,
          type: 'app',
          title: app.label,
          description: 'Application',
          icon: app.icon,
          color: app.color,
          action: () => {
            os.openApp(app.id as AppID);
            onClose();
          }
        });
      }
    });

    // Search Files
    // Added explicit type for Object.entries to fix 'unknown' type error for file variable
    (Object.entries(os.files) as [string, FileSystemFile][]).forEach(([name, file]) => {
      if (name.toLowerCase().includes(q)) {
        list.push({
          id: `file-${name}`,
          type: 'file',
          title: name,
          description: 'Document File',
          icon: file.type === 'image' ? 'fa-image' : 'fa-file-lines',
          color: 'bg-gray-600',
          action: () => {
            if (file.type === 'text') {
              os.openApp(AppID.NOTEPAD);
              // NotepadApp currently just reads 'note.txt' or last active from FS
              // But we can trigger a signal if NotepadApp was reactive to a specific file prop
              os.showNotification("File Selected", `Opening ${name} in editor...`, "info");
            }
            onClose();
          }
        });
      }
    });

    // Search Settings keywords
    const settingsKeywords = [
      { k: 'wallpaper', t: 'Change Wallpaper', d: 'Desktop background settings' },
      { k: 'theme', t: 'Dark Mode', d: 'Appearance settings' },
      { k: 'telegram', t: 'Link Telegram Bot', d: 'Remote control configuration' },
      { k: 'name', t: 'Change Agent Name', d: 'Identity settings' },
    ];

    settingsKeywords.forEach(set => {
      if (set.k.includes(q) || set.t.toLowerCase().includes(q)) {
        list.push({
          id: `setting-${set.k}`,
          type: 'setting',
          title: set.t,
          description: set.d,
          icon: 'fa-gear',
          color: 'bg-blue-400',
          action: () => {
            os.openApp(AppID.SETTINGS);
            onClose();
          }
        });
      }
    });

    return list;
  }, [query, apps, os, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      results[selectedIndex].action();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-md flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: -20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10 bg-white/5">
          <i className="fa-solid fa-magnifying-glass text-xl text-blue-400"></i>
          <input 
            id="global-os-search"
            name="global-os-search"
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-xl text-white placeholder:text-white/20"
            placeholder="Search apps, files, settings..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/40 tracking-widest">
            Esc
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {results.length > 0 ? (
            results.map((result, index) => (
              <button
                key={result.id}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={result.action}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left ${
                  index === selectedIndex ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'hover:bg-white/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${result.color} flex items-center justify-center shadow-lg shrink-0`}>
                  <i className={`fa-solid ${result.icon} text-lg text-white`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold truncate ${index === selectedIndex ? 'text-white' : 'text-gray-200'}`}>
                    {result.title}
                  </h4>
                  <p className={`text-[10px] uppercase font-black tracking-widest ${index === selectedIndex ? 'text-white/60' : 'text-gray-500'}`}>
                    {result.description}
                  </p>
                </div>
                {index === selectedIndex && (
                  <div className="px-2 py-1 rounded bg-white/20 text-[9px] font-black text-white uppercase tracking-tighter">
                    Enter
                  </div>
                )}
              </button>
            ))
          ) : query ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 opacity-50">
              <i className="fa-solid fa-ghost text-4xl mb-4"></i>
              <p className="text-sm font-medium uppercase tracking-widest">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="p-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 px-2">Suggestions</h3>
              <div className="grid grid-cols-2 gap-2">
                 {apps.slice(0, 4).map(app => (
                   <button 
                     key={app.id} 
                     onClick={() => { os.openApp(app.id as AppID); onClose(); }}
                     className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
                   >
                     <div className={`w-8 h-8 rounded-lg ${app.color} flex items-center justify-center shrink-0`}>
                        <i className={`fa-solid ${app.icon} text-sm text-white`}></i>
                     </div>
                     <span className="text-xs font-bold text-gray-300">{app.label}</span>
                   </button>
                 ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-3 bg-black/20 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/30">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-arrow-up-long"></i> <i className="fa-solid fa-arrow-down-long"></i> Navigate</span>
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-level-down rotate-90"></i> Select</span>
          </div>
          <div>GeminiOS Search v2.0</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GlobalSearch;
