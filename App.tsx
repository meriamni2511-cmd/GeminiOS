
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppID, WindowState, SystemTheme, OSContextType, FileSystemFile, TelegramConfig, UserProfile, Notification } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import Window from './components/Window';
import GlobalSearch from './components/GlobalSearch';
import AgentApp from './apps/AgentApp';
import NotepadApp from './apps/NotepadApp';
import BrowserApp from './apps/BrowserApp';
import TerminalApp from './apps/TerminalApp';
import YouTubeApp from './apps/YouTubeApp';
import GmailApp from './apps/GmailApp';
import AboutApp from './apps/AboutApp';
import { fetchTelegramUpdates } from './services/telegramService';

const getInitialSize = (appId: AppID) => {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const isMobile = sw < 768;
  if (isMobile) return { width: sw, height: sh - 100 };
  
  switch (appId) {
    case AppID.AGENT: return { width: 340, height: 550 };
    case AppID.SETTINGS: return { width: 450, height: 750 };
    case AppID.BROWSER: return { width: 1000, height: 700 };
    default: return { width: 600, height: 500 };
  }
};

const getInitialPos = (size: { width: number, height: number }, appId: AppID) => {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    if (sw < 768) return { x: 0, y: 0 };
    if (appId === AppID.AGENT) return { x: sw - size.width - 40, y: sh - size.height - 120 };
    return { x: (sw - size.width) / 2, y: (sh - size.height) / 2 - 40 };
};

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [files, setFiles] = useState<Record<string, FileSystemFile>>({});
  const [memories, setMemories] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('gemini_os_memories');
    return saved ? JSON.parse(saved) : {};
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [theme, setTheme] = useState<SystemTheme>({
    wallpaper: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2066&auto=format&fit=crop',
    isDarkMode: true,
    accentColor: 'blue'
  });
  const [user, setUserState] = useState<UserProfile>({
    email: 'alex.knight@gemini.io',
    name: 'Alex Knight',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocL_K_G09G9...',
    isAuthenticated: true
  });
  const [telegram, setTelegram] = useState<TelegramConfig>({
    botToken: '',
    lastUpdateId: 0,
    isConnected: false,
    agentName: 'Sarah',
    agentEmail: 'sarah.agent.os@gmail.com'
  });

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    setWindows(prev => {
        const target = prev.find(w => w.id === id);
        if (!target) return prev;
        const otherWindows = prev.filter(w => w.id !== id);
        return [...otherWindows, { ...target, zIndex: 50 }].map((w, i) => ({ ...w, zIndex: 10 + i }));
    });
  };

  const openApp = useCallback((appId: AppID, initialState?: any) => {
    const existing = windows.find(w => w.appId === appId);
    if (existing) {
      if (existing.isMinimized) {
        setWindows(prev => prev.map(w => w.id === existing.id ? { ...w, isMinimized: false } : w));
        focusWindow(existing.id);
      } else {
        focusWindow(existing.id);
      }
      return;
    }
    const size = getInitialSize(appId);
    const pos = getInitialPos(size, appId);
    const newWindow: WindowState = {
      id: Math.random().toString(36).substr(2, 9),
      appId,
      title: appId.charAt(0).toUpperCase() + appId.slice(1),
      isOpen: true,
      isMinimized: false,
      isMaximized: window.innerWidth < 768,
      zIndex: 50,
      position: pos,
      size: size,
      appState: initialState || {}
    };
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  }, [windows]);

  const osContext: OSContextType = {
    windows,
    activeWindowId,
    theme,
    files,
    telegram,
    user,
    notifications,
    memories,
    openApp,
    closeWindow: (id) => {
      setWindows(prev => prev.filter(w => w.id !== id));
      if (activeWindowId === id) setActiveWindowId(null);
    },
    minimizeWindow: (id) => {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
      setActiveWindowId(null);
    },
    maximizeWindow: (id) => {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
      focusWindow(id);
    },
    focusWindow,
    updateWindowPosition: (id, x, y) => {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x, y } } : w));
    },
    updateWindowSize: (id, width, height) => {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, size: { width, height } } : w));
    },
    updateWindowState: (id, state) => {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, appState: { ...w.appState, ...state } } : w));
    },
    setTheme: (newTheme) => setTheme(prev => ({ ...prev, ...newTheme })),
    setTelegramConfig: (newConfig) => setTelegram(prev => ({ ...prev, ...newConfig })),
    setUser: (newUser) => setUserState(prev => ({ ...prev, ...newUser })),
    saveFile: (name, content) => setFiles(prev => ({ ...prev, [name]: { name, content, type: 'text' }})),
    readFile: (name) => files[name]?.content,
    saveMemory: (key, value) => {
      setMemories(prev => {
        const next = { ...prev, [key]: value };
        localStorage.setItem('gemini_os_memories', JSON.stringify(next));
        return next;
      });
    },
    deleteMemory: (key) => {
      setMemories(prev => {
        const next = { ...prev };
        delete next[key];
        localStorage.setItem('gemini_os_memories', JSON.stringify(next));
        return next;
      });
    },
    showNotification: (title, message, type = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }
  };

  const desktopApps = [
    { id: AppID.AGENT, label: 'Gemini', icon: 'spark', color: 'from-indigo-500 to-blue-600', cat: 'Productivity' },
    { id: AppID.SETTINGS, label: 'Settings', icon: 'settings', color: 'from-gray-700 to-gray-900', cat: 'Utilities' },
    { id: AppID.NOTEPAD, label: 'Notes', icon: 'description', color: 'from-yellow-300 to-yellow-500', cat: 'Productivity' },
    { id: AppID.BROWSER, label: 'Browser', icon: 'public', color: 'from-blue-400 to-cyan-500', cat: 'Utilities' },
    { id: AppID.YOUTUBE, label: 'Stream', icon: 'play_circle', color: 'from-purple-600 to-purple-900', cat: 'Entertainment' },
    { id: AppID.GMAIL, label: 'Mail', icon: 'mail', color: 'from-gray-600 to-gray-800', cat: 'Social' },
    { id: AppID.TERMINAL, label: 'Console', icon: 'terminal', color: 'from-emerald-500 to-emerald-700', cat: 'Utilities' }
  ];

  const filteredApps = desktopApps.filter(app => activeCategory === 'All' || app.cat === activeCategory);

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display transition-all duration-700" style={{ backgroundColor: '#101622' }}>
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#135bec]/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Top Status Bar (Mock) */}
      <div className="w-full flex justify-between items-center px-6 pt-5 pb-2 text-sm font-medium z-[100] relative">
        <div className="text-white tracking-widest text-[13px]">9:41</div>
        <div className="flex items-center gap-2 text-white">
          <span className="material-symbols-outlined text-[18px]">signal_cellular_alt</span>
          <span className="material-symbols-outlined text-[18px]">wifi</span>
          <span className="material-symbols-outlined text-[18px]">battery_full</span>
        </div>
      </div>

      {/* Main OS Viewport */}
      <div className="relative w-full h-full flex flex-col items-center">
        
        {/* Global Search Bar */}
        <div className="w-full max-w-xl px-5 py-4 z-50">
          <div className="relative group" onClick={() => setIsSearchOpen(true)}>
            <div className="absolute inset-0 bg-[#135bec]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center w-full h-14 rounded-full bg-white/10 backdrop-blur-md shadow-lg border border-white/10 overflow-hidden cursor-pointer transition-all duration-300">
              <div className="pl-5 pr-3 text-gray-400">
                <span className="material-symbols-outlined">search</span>
              </div>
              <div className="flex-1 text-base text-gray-400 font-medium">Gemini Search</div>
              <div className="pr-5 text-[#135bec]">
                <span className="material-symbols-outlined">mic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Chips */}
        <div className="w-full overflow-x-auto no-scrollbar pb-2 px-5 z-40 flex justify-center">
          <div className="flex gap-3">
            {['All', 'Productivity', 'Social', 'Entertainment', 'Utilities'].map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex h-9 items-center justify-center px-5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                  activeCategory === cat 
                  ? 'bg-[#135bec] shadow-[0_0_15px_rgba(19,91,236,0.4)] text-white' 
                  : 'bg-white/10 border border-white/5 backdrop-blur-sm text-gray-300 hover:bg-white/20'
                }`}
              >
                {cat === 'All' ? 'All Apps' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop App Grid */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden pb-40 px-6 pt-8 no-scrollbar fade-mask z-30">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 ml-2">Installed Apps</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-10 gap-x-4 justify-items-center">
              {filteredApps.map(app => (
                <div key={app.id} onClick={() => openApp(app.id)} className="flex flex-col items-center gap-2 group cursor-pointer app-icon-hover">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg relative overflow-hidden border border-white/10`}>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="material-symbols-outlined text-white text-[32px]">{app.icon}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-300 text-center tracking-wide">{app.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Dock */}
        <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="h-[88px] w-full max-w-lg rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center justify-evenly px-6 pointer-events-auto">
            {[
              { id: AppID.BROWSER, icon: 'public', color: 'bg-blue-500' },
              { id: AppID.GMAIL, icon: 'mail', color: 'bg-gray-600' },
              { id: AppID.AGENT, icon: 'spark', color: 'bg-[#135bec]' },
              { id: AppID.YOUTUBE, icon: 'play_circle', color: 'bg-purple-600' },
              { id: AppID.SETTINGS, icon: 'settings', color: 'bg-slate-700' }
            ].map(dockApp => (
              <div 
                key={dockApp.id} 
                onClick={() => openApp(dockApp.id)}
                className="flex flex-col items-center group cursor-pointer app-icon-hover"
              >
                <div className={`w-14 h-14 rounded-full ${dockApp.color} flex items-center justify-center shadow-lg transition-transform group-hover:-translate-y-2`}>
                  <span className="material-symbols-outlined text-white text-[28px]">{dockApp.icon}</span>
                </div>
                {windows.some(w => w.appId === dockApp.id) && (
                  <div className="w-1 h-1 bg-white rounded-full mt-1"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Windows Rendering */}
        <AnimatePresence mode="popLayout">
          {windows.map(win => (
            <Window
              key={win.id}
              windowState={win}
              isActive={activeWindowId === win.id}
              onFocus={() => focusWindow(win.id)}
              onClose={() => osContext.closeWindow(win.id)}
              onMinimize={() => osContext.minimizeWindow(win.id)}
              onMaximize={() => osContext.maximizeWindow(win.id)}
              onMove={(x, y) => osContext.updateWindowPosition(win.id, x, y)}
              onResize={(w, h) => osContext.updateWindowSize(win.id, w, h)}
            >
              {win.appId === AppID.AGENT && <AgentApp os={osContext} windowState={win} />}
              {win.appId === AppID.SETTINGS && <SettingsAppUI os={osContext} />}
              {win.appId === AppID.NOTEPAD && <NotepadApp os={osContext} />}
              {win.appId === AppID.BROWSER && <BrowserApp windowState={win} os={osContext} />}
              {win.appId === AppID.YOUTUBE && <YouTubeApp os={osContext} />}
              {win.appId === AppID.GMAIL && <GmailApp os={osContext} />}
              {win.appId === AppID.TERMINAL && <TerminalApp />}
              {win.appId === AppID.ABOUT && <AboutApp />}
            </Window>
          ))}
        </AnimatePresence>

        {/* Global Search Overlay */}
        <AnimatePresence>
          {isSearchOpen && <GlobalSearch os={osContext} onClose={() => setIsSearchOpen(false)} />}
        </AnimatePresence>

        {/* Notifications */}
        <div className="fixed top-20 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="pointer-events-auto glass w-72 p-4 rounded-2xl flex items-start gap-3 shadow-xl"
              >
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  n.type === 'error' ? 'bg-red-500' : 
                  n.type === 'success' ? 'bg-emerald-500' : 'bg-[#135bec]'
                }`}></div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{n.title}</h4>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Settings UI Implementation (from mockup) ---
const SettingsAppUI: React.FC<{ os: OSContextType }> = ({ os }) => {
  return (
    <div className="h-full bg-[#101622] text-white flex flex-col overflow-hidden font-display">
      <div className="px-6 pt-8 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 overflow-hidden">
            <img alt="User" className="w-full h-full object-cover" src="https://ui-avatars.com/api/?name=Alex+Knight&background=135bec&color=fff"/>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-[#135bec]/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center w-full h-11 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden px-4">
            <span className="material-symbols-outlined text-gray-400 text-[20px] mr-3">search</span>
            <input className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-gray-500 text-white" placeholder="Search settings..."/>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 px-5 pt-2 no-scrollbar fade-mask">
        {/* Profile Card */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#135bec] to-blue-600 p-4 text-white shadow-lg relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg font-bold">AK</div>
            <div className="flex-1">
              <h2 className="text-base font-bold leading-tight">Alex Knight</h2>
              <p className="text-blue-100 text-[10px]">Gemini ID, iCloud, Media & Purchases</p>
            </div>
            <span className="material-symbols-outlined text-white/70">chevron_right</span>
          </div>
        </div>

        {/* Settings Group 1 */}
        <div className="mb-6 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">flight</span></div>
              <span className="text-sm font-medium">Airplane Mode</span>
            </div>
            <div className="w-10 h-6 bg-gray-700 rounded-full relative"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#135bec] flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">wifi</span></div>
              <span className="text-sm font-medium">Wi-Fi</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-xs">Gemini_5G</span>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-400 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">bluetooth</span></div>
              <span className="text-sm font-medium">Bluetooth</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-xs">On</span>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </div>
          </div>
        </div>

        {/* Settings Group 2 */}
        <div className="mb-6 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
          <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">notifications</span></div>
              <span className="text-sm font-medium">Notifications</span>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">volume_up</span></div>
              <span className="text-sm font-medium">Sounds & Haptics</span>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </div>
          <div className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">bedtime</span></div>
              <span className="text-sm font-medium">Focus</span>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </div>
        </div>

        <div className="px-4 py-2 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gemini OS v1.0.2 (Beta)</p>
          <p className="text-[9px] text-gray-600 mt-1">Designed for Conceptual Purposes</p>
        </div>
      </div>
    </div>
  );
}

export default App;
