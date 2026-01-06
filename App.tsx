
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import FilesApp from './apps/FilesApp';
import { sendMessageToAgent } from './services/geminiService';
import { fetchTelegramUpdates, sendTelegramMessage, sendTelegramAction, deleteTelegramWebhook } from './services/telegramService';

const getInitialSize = (appId: AppID) => {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const isMobile = sw < 768;
  
  if (isMobile) return { width: sw, height: sh - 44 }; 

  // Saiz Adaptif 'Goldilocks' (65-80% skrin, tidak terlalu kecil/besar)
  const adaptWidth = (p: number) => Math.max(400, Math.min(sw * 0.85, sw * p));
  const adaptHeight = (p: number) => Math.max(450, Math.min(sh * 0.8, sh * p));

  switch (appId) {
    case AppID.AGENT: return { width: 380, height: 650 };
    case AppID.NOTEPAD: return { width: adaptWidth(0.65), height: adaptHeight(0.7) };
    case AppID.FILES: return { width: adaptWidth(0.6), height: adaptHeight(0.55) };
    case AppID.BROWSER: return { width: adaptWidth(0.85), height: adaptHeight(0.85) };
    default: return { width: adaptWidth(0.7), height: adaptHeight(0.75) };
  }
};

const getInitialPos = (size: { width: number, height: number }, appId: AppID) => {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    if (sw < 768) return { x: 0, y: 0 };
    
    if (appId === AppID.AGENT) return { x: sw - size.width - 40, y: 60 };
    // Center adaptive positioning
    return { x: (sw - size.width) / 2, y: (sh - size.height) / 2 - 20 };
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

  useEffect(() => { telegramRef.current = telegram; }, [telegram]);
  useEffect(() => { memoriesRef.current = memories; }, [memories]);
  useEffect(() => { windowsRef.current = windows; }, [windows]);
  useEffect(() => { filesRef.current = files; }, [files]);

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    setWindows(prev => {
        const target = prev.find(w => w.id === id);
        if (!target) return prev;
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
      setWindows(prev => prev.map(w => w.id === existing.id ? { ...w, isMinimized: false } : w));
      focusWindow(existing.id);
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
      zIndex: 100,
      position: pos,
      size: size,
      appState: initialState || {}
    };
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  }, []);

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
    closeWindow,
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
    setTelegramConfig: (newConfig) => {
        setTelegram(prev => {
            const next = { ...prev, ...newConfig };
            localStorage.setItem('gemini_os_telegram_v2', JSON.stringify(next));
            return next;
        });
    },
    setUser: (newUser) => setUserState(prev => ({ ...prev, ...newUser })),
    saveFile: (name, content) => setFiles(prev => {
      const next = { ...prev, [name]: { name, content, type: 'text', modified: new Date().toISOString(), size: `${Math.round(content.length/1024)}kb` }};
      localStorage.setItem('gemini_os_files', JSON.stringify(next));
      return next;
    }),
    deleteFile: (name) => setFiles(prev => {
      const next = { ...prev };
      delete next[name];
      localStorage.setItem('gemini_os_files', JSON.stringify(next));
      return next;
    }),
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

  useEffect(() => {
    if (!telegram.botToken) return;
    const abortController = new AbortController();
    let isPolling = true;

    const poll = async () => {
      await deleteTelegramWebhook(telegramRef.current.botToken);
      while (isPolling) {
        try {
          const currentToken = telegramRef.current.botToken;
          const currentOffset = telegramRef.current.lastUpdateId;
          const updates = await fetchTelegramUpdates(currentToken, currentOffset, abortController.signal);
          
          if (updates && updates.length > 0) {
            setIsSarahThinking(true);
            let maxId = currentOffset;
            for (const update of updates) {
              if (update.update_id > maxId) maxId = update.update_id;
              if (update.message?.text) {
                const chatId = update.message.chat.id;
                const userText = update.message.text;
                
                const response = await sendMessageToAgent(
                  [], 
                  userText,
                  { name: telegramRef.current.agentName, email: telegramRef.current.agentEmail },
                  memoriesRef.current,
                  undefined,
                  Object.keys(filesRef.current)
                );

                const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
                const responseText = textPart?.text || "Neural task acknowledged, BOS Adam.";

                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.functionCall) {
                            const call = part.functionCall;
                            if (call.name === 'openApp') openApp(call.args.appName as AppID);
                            
                            if (call.name === 'closeApp') {
                                const appIdToClose = call.args.appName as AppID;
                                // Cari tetingkap yang sepadan dengan appId
                                const winToClose = windowsRef.current.find(w => w.appId === appIdToClose);
                                if (winToClose) {
                                    closeWindow(winToClose.id);
                                    osContext.showNotification("System Control", `${appIdToClose} has been remotely closed.`, "info");
                                }
                            }

                            if (call.name === 'writeNote') osContext.saveFile(call.args.fileName || 'note.txt', call.args.content);
                            if (call.name === 'saveMemory') osContext.saveMemory(call.args.key, call.args.value);
                            if (call.name === 'notifyUser') osContext.showNotification(call.args.title, call.args.message, call.args.type);
                        }
                    }
                }
                await sendTelegramMessage(currentToken, chatId, responseText);
              }
            }
            osContext.setTelegramConfig({ lastUpdateId: maxId });
            setIsSarahThinking(false);
          }
        } catch (e: any) {
          if (e.name === 'AbortError') break;
          console.error("Sarah Polling Error:", e);
          await new Promise(r => setTimeout(r, 5000));
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    };
    poll();
    return () => { isPolling = false; abortController.abort(); };
  }, [telegram.botToken, openApp, closeWindow]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const desktopApps = [
    { id: AppID.AGENT, label: 'Sarah AI', icon: 'psychology', color: 'from-blue-600 to-indigo-700' },
    { id: AppID.FILES, label: 'Explorer', icon: 'folder', color: 'from-amber-400 to-orange-500' },
    { id: AppID.BROWSER, label: 'Web', icon: 'public', color: 'from-cyan-500 to-blue-600' },
    { id: AppID.GMAIL, label: 'Gmail', icon: 'mail', color: 'from-gray-700 to-slate-900' },
    { id: AppID.TERMINAL, label: 'Terminal', icon: 'terminal', color: 'from-emerald-500 to-teal-700' },
    { id: AppID.SETTINGS, label: 'Settings', icon: 'settings', color: 'from-blue-400 to-blue-500' }
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070a] select-none">
      
      {/* Premium Interative Status Bar */}
      <div className="fixed top-0 left-0 w-full h-10 flex justify-between items-center px-6 z-[2000] backdrop-blur-md bg-black/10 border-b border-white/5">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer hover:bg-white/5 px-2 py-1 rounded-md transition-all">
                <span className="text-[12px] font-black text-white">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isSarahThinking ? 'bg-primary animate-ping shadow-[0_0_10px_var(--primary)]' : 'bg-emerald-500'}`}></div>
            </div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">GeminiOS Titan v2.7 Adaptive Learning</div>
        </div>

        <div className="flex items-center gap-5">
           <div className="flex items-center gap-1.5 hover:text-white text-white/60 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">wifi</span>
              <span className="text-[10px] font-bold">NeuralSync 5G</span>
           </div>
           <div className="flex items-center gap-1.5 hover:text-white text-white/60 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">battery_very_low</span>
              <span className="text-[10px] font-bold">14%</span>
           </div>
           <div className="flex items-center gap-3 pl-3 border-l border-white/10 group cursor-pointer" onClick={() => openApp(AppID.SETTINGS)}>
              <span className="text-[10px] font-black text-white/40 group-hover:text-white transition-colors">{user.name}</span>
              <img src={user.avatar} className="w-5 h-5 rounded-full border border-white/20" alt="Avatar" />
           </div>
        </div>
      </div>

      <div className="relative w-full h-full flex flex-col items-center pt-14">
        
        {/* Futuristic Search Field */}
        <div className="w-full max-w-lg px-6 mb-12 z-[100]">
           <motion.div 
             whileHover={{ scale: 1.01, borderColor: 'rgba(19,91,236,0.5)' }}
             whileTap={{ scale: 0.98 }}
             onClick={() => setIsSearchOpen(true)}
             className="relative flex items-center h-14 w-full glass rounded-2xl px-6 cursor-pointer shadow-2xl border-white/10 group overflow-hidden"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <span className="material-symbols-outlined text-primary text-[24px] mr-4">search</span>
             <span className="text-white/40 text-[13px] font-bold tracking-widest uppercase">Instruct Neural Agent...</span>
             <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] font-black text-white/20 border border-white/10 px-2 py-1 rounded bg-black/20">CTRL + K</span>
             </div>
           </motion.div>
        </div>

        {/* Dynamic Desktop Grid */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar px-10 pb-44 z-50">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-x-8 gap-y-12 justify-items-center">
              {desktopApps.map(app => (
                <motion.div 
                  key={app.id}
                  whileHover={{ y: -10, scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => openApp(app.id)}
                  className="flex flex-col items-center gap-4 cursor-pointer group"
                >
                  <div className={`w-16 h-16 rounded-[1.6rem] bg-gradient-to-br ${app.color} flex items-center justify-center shadow-2xl border border-white/20 relative overflow-hidden transition-all group-hover:shadow-primary/40 group-hover:ring-4 group-hover:ring-primary/20`}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="material-symbols-outlined text-white text-[34px] drop-shadow-xl">{app.icon}</span>
                  </div>
                  <span className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase transition-colors group-hover:text-white">{app.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Premium Dock */}
        <div className="fixed bottom-8 left-0 right-0 flex justify-center px-6 z-[2000] pointer-events-none">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-20 w-full max-w-lg rounded-[2.5rem] glass border-white/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] flex items-center justify-evenly px-6 pointer-events-auto ring-1 ring-white/5 relative"
          >
            {isSarahThinking && (
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/40">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Sarah Thinking...</span>
               </div>
            )}
            {[
              { id: AppID.AGENT, icon: 'psychology', color: 'bg-primary' },
              { id: AppID.FILES, icon: 'folder', color: 'bg-amber-500' },
              { id: AppID.BROWSER, icon: 'public', color: 'bg-blue-500' },
              { id: AppID.TERMINAL, icon: 'terminal', color: 'bg-emerald-600' },
              { id: AppID.SETTINGS, icon: 'settings', color: 'bg-gray-600' }
            ].map(dockApp => (
              <motion.div 
                key={dockApp.id}
                whileHover={{ y: -15, scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => openApp(dockApp.id)}
                className="relative group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-[1.4rem] ${dockApp.color} flex items-center justify-center shadow-xl transition-all border border-white/10 group-hover:border-white/40`}>
                  <span className="material-symbols-outlined text-white text-[24px]">{dockApp.icon}</span>
                </div>
                {windows.some(w => w.appId === dockApp.id) && (
                   <motion.div 
                     layoutId="active-dot"
                     className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"
                   />
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
              {win.appId === AppID.YOUTUBE && <YouTubeApp os={osContext} />}
              {win.appId === AppID.GMAIL && <GmailApp os={osContext} />}
              {win.appId === AppID.TERMINAL && <TerminalApp />}
              {win.appId === AppID.ABOUT && <AboutApp />}
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
            n.type === 'success' ? 'bg-emerald-500' : 'bg-primary'
          }`}></div>
          <div className={`mt-1 w-11 h-11 rounded-[1.2rem] flex items-center justify-center shrink-0 ${
            n.type === 'error' ? 'bg-red-500/10 text-red-500' : 
            n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
          }`}>
             <span className="material-symbols-outlined text-[24px]">
                {n.type === 'error' ? 'error' : n.type === 'success' ? 'check_circle' : 'info'}
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
