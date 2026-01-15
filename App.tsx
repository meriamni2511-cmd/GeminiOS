
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppID, WindowState, SystemTheme, OSContextType, FileSystemFile, TelegramConfig, UserProfile, Notification, Task, TaskStatus } from './types';
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
import FilesApp from './apps/FilesApp';
import WeatherApp from './apps/WeatherApp';
import BoardApp from './apps/BoardApp';
import { sendMessageToAgent } from './services/geminiService';
import { fetchTelegramUpdates, sendTelegramMessage, sendTelegramAction, deleteTelegramWebhook } from './services/telegramService';

const getInitialSize = (appId: AppID) => {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const isMobile = sw < 768;
  
  if (isMobile) return { width: sw, height: sh - 44 }; 

  const adaptWidth = (p: number) => Math.max(400, Math.min(sw * 0.85, sw * p));
  const adaptHeight = (p: number) => Math.max(450, Math.min(sh * 0.8, sh * p));

  switch (appId) {
    case AppID.AGENT: return { width: 400, height: 700 }; // Taller, slimmer agent
    case AppID.NOTEPAD: return { width: 700, height: 500 };
    case AppID.FILES: return { width: 800, height: 550 };
    case AppID.BROWSER: return { width: 1000, height: 700 };
    case AppID.WEATHER: return { width: 380, height: 550 };
    case AppID.GMAIL: return { width: 950, height: 650 };
    case AppID.BOARD: return { width: 1100, height: 700 };
    default: return { width: 800, height: 600 };
  }
};

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, FileSystemFile>>(() => {
    const saved = localStorage.getItem('gemini_os_files');
    return saved ? JSON.parse(saved) : {
      'readme.txt': { name: 'readme.txt', content: 'Selamat Datang ke GeminiOS Titan Edition.', type: 'text', modified: new Date().toISOString(), size: '1kb' }
    };
  });
  const [memories, setMemories] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('gemini_os_memories');
    return saved ? JSON.parse(saved) : {};
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('gemini_os_tasks');
    const defaultTasks: Partial<Task>[] = [
      { id: '1', title: 'Initialize System', status: 'done', priority: 'high', createdAt: new Date().toISOString() },
      { id: '2', title: 'Review Project Goals', status: 'todo', priority: 'medium', createdAt: new Date().toISOString() }
    ];
    let parsed = saved ? JSON.parse(saved) : defaultTasks;
    return parsed.map((t: any, i: number) => ({ ...t, order: t.order ?? i }));
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSarahThinking, setIsSarahThinking] = useState(false);
  const [time, setTime] = useState(new Date());

  const [theme, setTheme] = useState<SystemTheme>({
    wallpaper: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2066&auto=format&fit=crop',
    isDarkMode: true,
    accentColor: 'blue'
  });

  const [user, setUserState] = useState<UserProfile>({
    email: 'mayasanztech@gmail.com',
    name: 'Adam Jck',
    avatar: 'https://ui-avatars.com/api/?name=Adam+Jck&background=135bec&color=fff',
    isAuthenticated: true
  });

  const [telegram, setTelegram] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('gemini_os_telegram_v2');
    return saved ? JSON.parse(saved) : {
      botToken: "8426272394:AAEXdzMybGhNCS3yyHNHVhdNcMicwr4oxFs",
      lastUpdateId: 0,
      isConnected: true,
      agentName: 'Sarah',
      agentEmail: 'sarah.agent.os@gmail.com'
    };
  });

  const telegramRef = useRef(telegram);
  const memoriesRef = useRef(memories);
  const windowsRef = useRef(windows);
  const filesRef = useRef(files);
  const tasksRef = useRef(tasks);
  const userRef = useRef(user);

  useEffect(() => { telegramRef.current = telegram; }, [telegram]);
  useEffect(() => { memoriesRef.current = memories; }, [memories]);
  useEffect(() => { windowsRef.current = windows; }, [windows]);
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { userRef.current = user; }, [user]);

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    setWindows(prev => {
        const target = prev.find(w => w.id === id);
        if (!target) return prev;
        // Move target to end of array to render on top, update zIndexes
        const otherWindows = prev.filter(w => w.id !== id);
        return [...otherWindows, { ...target, zIndex: 100 }].map((w, i) => ({ ...w, zIndex: 10 + i }));
    });
  };

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  }, [activeWindowId]);

  const openApp = useCallback((appId: AppID, initialState?: any) => {
    const existing = windowsRef.current.find(w => w.appId === appId);
    if (existing) {
      setWindows(prev => prev.map(w => w.id === existing.id ? { ...w, isMinimized: false, appState: { ...w.appState, ...initialState } } : w));
      focusWindow(existing.id);
      return;
    }

    // --- LIMIT CHECK: MAX 4 APPS (Increased for better multitasking) ---
    if (windowsRef.current.length >= 4) {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications(prev => [...prev, { 
        id, 
        title: 'Memory Full', 
        message: 'Please close an application to open more.', 
        type: 'warning' 
      }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
      return;
    }
    // -------------------------------

    const size = getInitialSize(appId);
    
    // CASCADING LOGIC:
    // Offset each new window slightly so they don't stack directly on top of each other
    const count = windowsRef.current.length;
    const cascadeOffset = count * 30; 
    const baseX = (window.innerWidth - size.width) / 2;
    const baseY = (window.innerHeight - size.height) / 2 - 40;
    
    // Default Cascade or Fixed Position for specific apps
    let pos = { 
        x: Math.max(0, baseX + cascadeOffset), 
        y: Math.max(40, baseY + cascadeOffset) 
    };

    if (appId === AppID.AGENT) pos = { x: window.innerWidth - size.width - 50, y: 80 };
    if (appId === AppID.WEATHER) pos = { x: 50, y: 80 };

    const newWindow: WindowState = {
      id: Math.random().toString(36).substr(2, 9),
      appId,
      title: appId.charAt(0).toUpperCase() + appId.slice(1),
      isOpen: true,
      isMinimized: false,
      isMaximized: false, // Default to windowed mode for better visibility
      zIndex: 100 + count,
      position: pos,
      size: size,
      appState: initialState || {}
    };
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  }, []);

  const osContext: OSContextType = {
    windows, activeWindowId, theme, files, telegram, user, notifications, memories, tasks,
    openApp, closeWindow, focusWindow,
    minimizeWindow: (id) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w)); setActiveWindowId(null); },
    maximizeWindow: (id) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)); focusWindow(id); },
    updateWindowPosition: (id, x, y) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x, y } } : w)); },
    updateWindowSize: (id, width, height) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, size: { width, height } } : w)); },
    updateWindowState: (id, state) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, appState: { ...w.appState, ...state } } : w)); },
    setTheme: (newTheme) => setTheme(prev => ({ ...prev, ...newTheme })),
    setTelegramConfig: (newConfig) => { setTelegram(prev => { const next = { ...prev, ...newConfig }; localStorage.setItem('gemini_os_telegram_v2', JSON.stringify(next)); return next; }); },
    setUser: (newUser) => setUserState(prev => ({ ...prev, ...newUser })),
    saveFile: (name, content) => setFiles(prev => { const next = { ...prev, [name]: { name, content, type: 'text' as const, modified: new Date().toISOString(), size: `${Math.round(content.length/1024)}kb` }}; localStorage.setItem('gemini_os_files', JSON.stringify(next)); return next; }),
    deleteFile: (name) => setFiles(prev => { const next = { ...prev }; delete next[name]; localStorage.setItem('gemini_os_files', JSON.stringify(next)); return next; }),
    readFile: (name) => files[name]?.content,
    saveMemory: (key, value) => { setMemories(prev => { const next = { ...prev, [key]: value }; localStorage.setItem('gemini_os_memories', JSON.stringify(next)); return next; }); },
    deleteMemory: (key) => { setMemories(prev => { const next = { ...prev }; delete next[key]; localStorage.setItem('gemini_os_memories', JSON.stringify(next)); return next; }); },
    showNotification: (title, message, type = 'info') => { const id = Math.random().toString(36).substr(2, 9); setNotifications(prev => [...prev, { id, title, message, type }]); setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000); },
    addTask: (title, status = 'todo', priority = 'medium') => { setTasks(prev => { const maxOrder = prev.reduce((max, t) => Math.max(max, t.order || 0), 0); const next = [...prev, { id: Math.random().toString(36).substr(2, 9), title, status, priority, order: maxOrder + 1, createdAt: new Date().toISOString() }]; localStorage.setItem('gemini_os_tasks', JSON.stringify(next)); return next; }); },
    updateTask: (id, updates) => { setTasks(prev => { const next = prev.map(t => t.id === id ? { ...t, ...updates } : t); localStorage.setItem('gemini_os_tasks', JSON.stringify(next)); return next; }); },
    moveTask: (taskId, newStatus, newIndex) => { setTasks(prev => { const t = prev.find(tt => tt.id === taskId); if(!t) return prev; const others = prev.filter(tt => tt.id !== taskId && tt.status !== newStatus); const targetCols = prev.filter(tt => tt.id !== taskId && tt.status === newStatus).sort((a, b) => a.order - b.order); const upT = { ...t, status: newStatus }; targetCols.splice(newIndex, 0, upT); const next = [...others, ...targetCols.map((tt, i) => ({ ...tt, order: i }))]; if (t.status !== newStatus) { const oldC = prev.filter(tt => tt.id !== taskId && tt.status === t.status).sort((a,b) => a.order-b.order).map((tt, i) => ({ ...tt, order: i })); return [...prev.filter(tt => tt.status !== newStatus && tt.status !== t.status), ...targetCols.map((tt, i) => ({ ...tt, order: i })), ...oldC]; } localStorage.setItem('gemini_os_tasks', JSON.stringify(next)); return next; }); },
    deleteTask: (id) => { setTasks(prev => { const next = prev.filter(t => t.id !== id); localStorage.setItem('gemini_os_tasks', JSON.stringify(next)); return next; }); }
  };

  // ... (Remote Dispatcher & Telegram Polling Logic - No Changes) ...
  // Keeping existing logic for performAction and useEffects
  const performAction = useCallback(async (name: string, args: any) => {
    console.log(`[MCP Remote] Executing: ${name}`, args);
    switch (name) {
        case 'openApp': 
            openApp(args.appName as AppID, args.initialState); break;
        case 'closeApp': 
            const w = windowsRef.current.find(win => win.appId === args.appName);
            if (w) closeWindow(w.id); break;
        case 'manageMemory':
            if (args.action === 'save') osContext.saveMemory(args.key, args.value);
            if (args.action === 'delete') osContext.deleteMemory(args.key);
            break;
        case 'fileSystem':
            if (args.action === 'write') osContext.saveFile(args.fileName, args.content);
            if (args.action === 'delete') osContext.deleteFile(args.fileName);
            break;
        case 'manageTasks':
            if (args.action === 'add') { osContext.addTask(args.title, args.status||'todo', args.priority||'medium'); openApp(AppID.BOARD); }
            if (args.action === 'move') { const t = tasksRef.current.find(tk=>tk.id===args.taskId); if(t) { osContext.updateTask(t.id, {status:args.status}); openApp(AppID.BOARD); }}
            if (args.action === 'delete') osContext.deleteTask(args.taskId);
            break;
        case 'notifyUser':
            osContext.showNotification(args.title, args.message, args.type);
            break;
        case 'devTools': 
             if (args.method === 'Page.navigate' && args.params?.url) {
                openApp(AppID.BROWSER, { url: args.params.url });
             }
             if (args.method === 'Page.reload') {
                const browserWin = windowsRef.current.find(w => w.appId === AppID.BROWSER);
                if (browserWin) osContext.updateWindowState(browserWin.id, { url: browserWin.appState?.url });
             }
             break;
    }
  }, [openApp, closeWindow]);

  useEffect(() => {
    if (!telegram.botToken || !telegram.isConnected) return;
    const abortController = new AbortController();
    let isPolling = true;
    const poll = async () => {
      await deleteTelegramWebhook(telegramRef.current.botToken);
      while (isPolling) {
        try {
          const updates = await fetchTelegramUpdates(telegramRef.current.botToken, telegramRef.current.lastUpdateId, abortController.signal);
          if (updates && updates.length > 0) {
            setIsSarahThinking(true);
            let maxId = telegramRef.current.lastUpdateId;
            for (const update of updates) {
              if (update.update_id > maxId) maxId = update.update_id;
              if (update.message?.text) {
                const response = await sendMessageToAgent(
                  [], update.message.text,
                  { name: telegramRef.current.agentName, email: telegramRef.current.agentEmail },
                  memoriesRef.current, undefined, Object.keys(filesRef.current), tasksRef.current,
                  userRef.current.name 
                );
                const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
                const responseText = textPart?.text || "Command executed.";
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.functionCall) {
                            await performAction(part.functionCall.name, part.functionCall.args);
                        }
                    }
                }
                await sendTelegramMessage(telegramRef.current.botToken, update.message.chat.id, responseText);
              }
            }
            osContext.setTelegramConfig({ lastUpdateId: maxId });
            setIsSarahThinking(false);
          }
        } catch (e: any) {
          if (e.name !== 'AbortError') await new Promise(r => setTimeout(r, 5000));
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    };
    poll();
    return () => { isPolling = false; abortController.abort(); };
  }, [telegram.botToken, telegram.isConnected, performAction]); 

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const desktopApps = [
    { id: AppID.AGENT, label: 'Sarah AI', icon: 'psychology', color: 'from-blue-600 to-indigo-700' },
    { id: AppID.BOARD, label: 'Workflow', icon: 'view_kanban', color: 'from-pink-500 to-rose-600' },
    { id: AppID.FILES, label: 'Explorer', icon: 'folder', color: 'from-amber-400 to-orange-500' },
    { id: AppID.BROWSER, label: 'Web', icon: 'public', color: 'from-cyan-500 to-blue-600' },
    { id: AppID.WEATHER, label: 'Weather', icon: 'cloud', color: 'from-sky-400 to-blue-500' },
    { id: AppID.GMAIL, label: 'Gmail', icon: 'mail', color: 'from-gray-700 to-slate-900' },
    { id: AppID.TERMINAL, label: 'Terminal', icon: 'terminal', color: 'from-emerald-500 to-teal-700' },
    { id: AppID.SETTINGS, label: 'Settings', icon: 'settings', color: 'from-blue-400 to-blue-500' }
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070a] select-none">
      {/* Status Bar */}
      <div className="fixed top-0 left-0 w-full h-10 flex justify-between items-center px-6 z-[2000] backdrop-blur-md bg-black/40 border-b border-white/5">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer hover:bg-white/5 px-2 py-1 rounded-md transition-all">
                <span className="text-[12px] font-black text-white">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isSarahThinking ? 'bg-primary animate-ping shadow-[0_0_10px_var(--primary)]' : 'bg-emerald-500'}`}></div>
            </div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Titan v2.7</div>
        </div>
        <div className="flex items-center gap-5">
           <div className="flex items-center gap-3 pl-3 border-l border-white/10 group cursor-pointer" onClick={() => openApp(AppID.SETTINGS)}>
              <span className="text-[10px] font-black text-white/40 group-hover:text-white transition-colors">{user.name}</span>
              <img src={user.avatar} className="w-5 h-5 rounded-full border border-white/20" alt="Avatar" />
           </div>
        </div>
      </div>

      <div className="relative w-full h-full flex flex-col items-center pt-14">
        {/* Desktop Search */}
        <div className="w-full max-w-lg px-6 mb-12 z-[100]">
           <motion.div 
             whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.2)' }}
             whileTap={{ scale: 0.98 }}
             onClick={() => setIsSearchOpen(true)}
             className="relative flex items-center h-12 w-full glass rounded-full px-6 cursor-pointer shadow-lg border-white/10 group overflow-hidden"
           >
             <span className="material-symbols-outlined text-white/50 text-[20px] mr-3">search</span>
             <span className="text-white/30 text-[12px] font-medium tracking-wide">Search GeminiOS...</span>
             <div className="ml-auto">
                <span className="text-[10px] font-bold text-white/20 border border-white/10 px-2 py-0.5 rounded">⌘K</span>
             </div>
           </motion.div>
        </div>

        {/* Desktop Icons */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar px-10 pb-44 z-50">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-x-8 gap-y-12 justify-items-center">
              {desktopApps.map(app => (
                <motion.div 
                  key={app.id}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => openApp(app.id)}
                  className="flex flex-col items-center gap-3 cursor-pointer group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg border border-white/10 relative overflow-hidden transition-all group-hover:shadow-xl group-hover:ring-2 group-hover:ring-white/20`}>
                    <span className="material-symbols-outlined text-white text-[28px] drop-shadow-md">{app.icon}</span>
                  </div>
                  <span className="text-[10px] font-medium text-white/60 group-hover:text-white transition-colors">{app.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Dock */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-6 z-[2000] pointer-events-none">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="h-16 px-4 rounded-[2rem] glass border-white/20 shadow-2xl flex items-center gap-4 pointer-events-auto bg-black/40 backdrop-blur-xl"
          >
            {[
              { id: AppID.AGENT, icon: 'psychology', color: 'bg-primary' },
              { id: AppID.GMAIL, icon: 'mail', color: 'bg-gray-700' },
              { id: AppID.FILES, icon: 'folder', color: 'bg-amber-500' },
              { id: AppID.BROWSER, icon: 'public', color: 'bg-blue-500' },
              { id: AppID.TERMINAL, icon: 'terminal', color: 'bg-emerald-600' },
              { id: AppID.SETTINGS, icon: 'settings', color: 'bg-gray-600' }
            ].map(dockApp => (
              <motion.div 
                key={dockApp.id}
                whileHover={{ y: -10, scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => openApp(dockApp.id)}
                className="relative group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl ${dockApp.color} flex items-center justify-center shadow-md transition-all`}>
                  <span className="material-symbols-outlined text-white text-[20px]">{dockApp.icon}</span>
                </div>
                {windows.some(w => w.appId === dockApp.id) && (
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-60"></div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <AnimatePresence>
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
              {win.appId === AppID.FILES && <FilesApp os={osContext} />}
              {win.appId === AppID.NOTEPAD && <NotepadApp os={osContext} />}
              {win.appId === AppID.BROWSER && <BrowserApp windowState={win} os={osContext} />}
              {win.appId === AppID.YOUTUBE && <YouTubeApp os={osContext} windowState={win} />}
              {win.appId === AppID.GMAIL && <GmailApp os={osContext} />}
              {win.appId === AppID.TERMINAL && <TerminalApp />}
              {win.appId === AppID.ABOUT && <AboutApp />}
              {win.appId === AppID.WEATHER && <WeatherApp os={osContext} location={win.appState?.location} />}
              {win.appId === AppID.BOARD && <BoardApp os={osContext} />}
              {win.appId === AppID.SETTINGS && <SettingsAppUI os={osContext} />}
            </Window>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isSearchOpen && <GlobalSearch os={osContext} onClose={() => setIsSearchOpen(false)} />}
        </AnimatePresence>

        <NotificationContainer notifications={notifications} />
      </div>
    </div>
  );
};
// ... Other components (SettingsAppUI, NotificationContainer) remain same ...
const SettingsAppUI: React.FC<{ os: OSContextType }> = ({ os }) => {
  return (
    <div className="h-full bg-[#0a0c10] text-white flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-10">
        <h1 className="text-4xl font-black tracking-tighter mb-10">System Control</h1>
        <div className="space-y-10">
          <div className="p-8 glass rounded-[2rem] flex items-center gap-6 border-white/10 shadow-2xl">
             <img src={os.user.avatar} className="w-20 h-20 rounded-[1.5rem] border-2 border-primary shadow-xl shadow-primary/20" alt="Profile" />
             <div>
                <p className="text-2xl font-black tracking-tight">{os.user.name}</p>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-1">{os.user.email}</p>
                <div className="flex gap-2 mt-4">
                   <button className="bg-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Edit Profile</button>
                   <button className="bg-white/5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Sign Out</button>
                </div>
             </div>
          </div>
          <div className="space-y-4">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] px-2">Remote Neural Protocol</p>
             <div className="p-6 glass rounded-[2rem] border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <span className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <i className="fa-brands fa-telegram text-blue-400 text-xl"></i>
                        Sarah Remote Link
                    </span>
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Encrypted</span>
                    </div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-[11px] text-white/60 mb-2 select-all">
                  {os.telegram.botToken}
                </div>
                <p className="text-[9px] text-white/30 italic">Biometric locking active. Sarah is monitoring all incoming neural pulses.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationContainer: React.FC<{ notifications: Notification[] }> = ({ notifications }) => (
  <div className="fixed top-14 right-6 z-[4000] flex flex-col gap-4 pointer-events-none">
    <AnimatePresence>
      {notifications.map(n => (
        <motion.div
          key={n.id}
          initial={{ x: 400, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ x: 400, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          className="pointer-events-auto glass w-80 p-6 rounded-[2rem] flex items-start gap-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border-white/10 relative overflow-hidden"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            n.type === 'error' ? 'bg-red-500' : 
            n.type === 'success' ? 'bg-emerald-500' : 
            n.type === 'warning' ? 'bg-amber-500' : 'bg-primary'
          }`}></div>
          <div className={`mt-1 w-11 h-11 rounded-[1.2rem] flex items-center justify-center shrink-0 ${
            n.type === 'error' ? 'bg-red-500/10 text-red-500' : 
            n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
            n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
          }`}>
             <span className="material-symbols-outlined text-[24px]">
                {n.type === 'error' ? 'error' : n.type === 'success' ? 'check_circle' : n.type === 'warning' ? 'warning' : 'info'}
             </span>
          </div>
          <div className="flex-1">
            <h4 className="text-[12px] font-black text-white uppercase tracking-widest">{n.title}</h4>
            <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed font-bold">{n.message}</p>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export default App;
