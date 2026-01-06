
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppID, WindowState } from '../types';

interface TaskbarProps {
  openApps: WindowState[];
  activeWindowId: string | null;
  onAppClick: (appId: AppID) => void;
  onStartClick: () => void;
  onSearchClick: () => void;
}

const Taskbar: React.FC<TaskbarProps> = ({ openApps, activeWindowId, onAppClick, onStartClick, onSearchClick }) => {
  const [time, setTime] = useState(new Date());
  const [hoveredApp, setHoveredApp] = useState<AppID | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const apps = [
    { id: AppID.AGENT, icon: 'fa-robot', color: 'from-purple-500 to-indigo-500', label: 'Sarah AI' },
    { id: AppID.BROWSER, icon: 'fa-globe', color: 'from-blue-500 to-cyan-500', label: 'Web' },
    { id: AppID.YOUTUBE, icon: 'fa-play', color: 'from-red-600 to-red-400', label: 'YouTube' },
    { id: AppID.GMAIL, icon: 'fa-envelope', color: 'from-indigo-600 to-blue-500', label: 'Gmail' },
    { id: AppID.NOTEPAD, icon: 'fa-file-signature', color: 'from-amber-400 to-orange-500', label: 'Notes' },
    { id: AppID.TERMINAL, icon: 'fa-terminal', color: 'from-emerald-500 to-teal-600', label: 'Console' },
    { id: AppID.SETTINGS, icon: 'fa-sliders', color: 'from-slate-400 to-slate-600', label: 'Control' },
  ];

  return (
    <div className="fixed bottom-4 left-0 w-full flex justify-center items-end px-4 z-[9999] pointer-events-none">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="flex items-center gap-2 glass p-2 rounded-2xl shadow-2xl pointer-events-auto border border-white/20"
      >
        <div className="flex gap-1.5">
          <motion.button 
            onClick={onStartClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <i className="fa-brands fa-windows text-xl text-white relative z-10"></i>
            
            <AnimatePresence>
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: -45 }}
                className="absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-[10px] text-white rounded whitespace-nowrap backdrop-blur-md pointer-events-none"
              >
                Start Menu
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.button 
            onClick={onSearchClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors shadow-lg border border-white/5"
          >
            <i className="fa-solid fa-magnifying-glass text-lg text-gray-400"></i>
            
            <AnimatePresence>
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: -45 }}
                className="absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-[10px] text-white rounded whitespace-nowrap backdrop-blur-md pointer-events-none"
              >
                Search (⌘K)
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>

        <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

        <div className="flex gap-1.5">
          {apps.map((app) => {
            const isOpen = openApps.some(w => w.appId === app.id);
            const isActive = openApps.find(w => w.appId === app.id)?.id === activeWindowId;
            
            return (
              <motion.button
                key={app.id}
                onClick={() => onAppClick(app.id)}
                onMouseEnter={() => setHoveredApp(app.id)}
                onMouseLeave={() => setHoveredApp(null)}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all"
              >
                {/* Background Highlight */}
                <motion.div 
                  initial={false}
                  animate={{ 
                    opacity: isActive || hoveredApp === app.id ? 1 : 0,
                    scale: isActive || hoveredApp === app.id ? 1 : 0.8
                  }}
                  className="absolute inset-0 rounded-xl bg-white/10"
                />

                <div className={`
                    relative z-10 w-10 h-10 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg
                    ${!isOpen ? 'opacity-60 grayscale-[40%]' : 'opacity-100'}
                    transition-all duration-300
                `}>
                    <i className={`fa-solid ${app.icon} text-lg text-white drop-shadow-md`}></i>
                </div>

                {/* Animated Indicator Dot */}
                {isOpen && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className={`absolute -bottom-1 h-1 rounded-full bg-white shadow-[0_0_8px_white] ${isActive ? 'w-4 opacity-100' : 'w-1 opacity-40'}`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Tooltip Label */}
                <AnimatePresence>
                  {hoveredApp === app.id && (
                    <motion.span 
                      initial={{ opacity: 0, y: 10, x: '-50%' }}
                      animate={{ opacity: 1, y: -45, x: '-50%' }}
                      exit={{ opacity: 0, y: 10, x: '-50%' }}
                      className="absolute left-1/2 px-2 py-1 bg-black/80 text-[10px] text-white rounded whitespace-nowrap backdrop-blur-md pointer-events-none z-50"
                    >
                      {app.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

        <motion.div 
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-xl border border-white/5 cursor-default transition-all duration-300"
        >
            <div className="flex flex-col items-end leading-none">
              <span className="text-[11px] font-bold text-white">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[9px] text-gray-400 mt-1">{time.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex gap-2 text-gray-400 text-[10px]">
                <i className="fa-solid fa-wifi text-blue-400 animate-pulse"></i>
                <i className="fa-solid fa-volume-high"></i>
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Taskbar;
