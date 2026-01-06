
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WindowState } from '../types';

interface WindowProps {
  windowState: WindowState;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  children: React.ReactNode;
}

const Window: React.FC<WindowProps> = ({
  windowState,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  children
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragOffset = useRef({ x: 0, y: 0, ratio: 0.5 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const windowStateRef = useRef(windowState);

  useEffect(() => {
    windowStateRef.current = windowState;
  }, [windowState]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    onFocus();
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);

    if (windowState.isMaximized) {
        const winWidth = window.innerWidth;
        const ratio = e.clientX / winWidth;
        dragOffset.current = { x: 0, y: e.clientY, ratio }; 
    } else {
        dragOffset.current = {
            x: e.clientX - windowState.position.x,
            y: e.clientY - windowState.position.y,
            ratio: 0.5
        };
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFocus();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: windowState.size.width,
      height: windowState.size.height
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const currentStats = windowStateRef.current;

        if (currentStats.isMaximized) {
          const restoredWidth = currentStats.size.width;
          let newX = e.clientX - (restoredWidth * dragOffset.current.ratio);
          const headerHeight = 44;
          const clickOffsetY = Math.min(dragOffset.current.y, headerHeight); 
          const newY = e.clientY - clickOffsetY;
          
          dragOffset.current = { x: e.clientX - newX, y: e.clientY - newY, ratio: 0 };
          onMaximize(); 
          onMove(newX, newY);
        } else {
          onMove(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y);
        }
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        
        const newWidth = Math.max(240, resizeStart.current.width + deltaX);
        const newHeight = Math.max(150, resizeStart.current.height + deltaY);
        
        onResize(newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, onMaximize, onMove, onResize]);

  if (!windowState.isOpen) return null;

  // Premium physics-based spring configuration
  const windowSpring = {
    type: "spring",
    stiffness: 380,
    damping: 28,
    mass: 0.8,
  };

  const minimizeSpring = {
    type: "spring",
    stiffness: 300,
    damping: 35,
    mass: 1.2,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 40, filter: "blur(10px)" }}
      animate={{ 
        opacity: windowState.isMinimized ? 0 : 1, 
        scale: windowState.isMinimized ? 0.3 : 1,
        y: windowState.isMinimized ? 400 : 0,
        filter: windowState.isMinimized ? "blur(20px)" : "blur(0px)",
        left: windowState.isMaximized ? 0 : windowState.position.x,
        top: windowState.isMaximized ? 0 : windowState.position.y,
        width: windowState.isMaximized ? '100%' : windowState.size.width,
        height: windowState.isMaximized ? 'calc(100% - 64px)' : windowState.size.height,
        zIndex: windowState.zIndex,
        pointerEvents: windowState.isMinimized ? 'none' : 'auto'
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.9, 
        y: 20, 
        filter: "blur(10px)",
        transition: { duration: 0.25, ease: "easeOut" } 
      }}
      transition={
        (isDragging || isResizing) 
          ? { duration: 0 } 
          : (windowState.isMinimized ? minimizeSpring : windowSpring)
      }
      onMouseDown={onFocus}
      className={`absolute flex flex-col bg-slate-950/80 backdrop-blur-3xl border rounded-2xl overflow-hidden
        ${isActive 
          ? 'shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] border-white/20 ring-1 ring-white/10' 
          : 'shadow-2xl border-white/10 hover:border-white/20 grayscale-[15%] opacity-[0.98]'
        } 
        ${isDragging ? 'cursor-grabbing select-none' : 'cursor-default'}
        transition-shadow duration-500 ease-out
      `}
    >
      {/* Premium Header */}
      <div
        className={`h-11 flex items-center justify-between px-4 bg-white/5 border-b border-white/5 select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={onMaximize}
      >
        <div className="flex items-center gap-2">
          {/* Mac-style traffic lights with hover effects */}
          <div className="flex gap-2 mr-3">
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff4b40] transition-all flex items-center justify-center group active:scale-90"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/40 font-bold">×</span>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onMinimize(); }} 
                className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffad1a] transition-all flex items-center justify-center group active:scale-90"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/40 font-bold">-</span>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onMaximize(); }} 
                className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#1fb334] transition-all flex items-center justify-center group active:scale-90"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[6px] text-black/40"><i className="fa-solid fa-expand"></i></span>
            </button>
          </div>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]"
          >
            {windowState.appId}
          </motion.span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-[11px] font-bold text-gray-100/80 pointer-events-none truncate max-w-[40%] tracking-tight">
           {windowState.title}
        </div>
        <div className="w-16"></div>
      </div>

      {/* Content Area with Staggered Entry */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex-1 overflow-hidden relative bg-slate-900/40"
      >
        {(isDragging || isResizing) && <div className="absolute inset-0 z-[100] bg-transparent" />}
        <div className="h-full w-full">
          {children}
        </div>
      </motion.div>

      {/* Resize Handle */}
      {!windowState.isMaximized && (
        <div 
          className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-[110] flex items-end justify-end p-1.5 group/resize"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/5 group-hover/resize:bg-white/40 group-hover/resize:scale-125 transition-all rotate-45 border-b-2 border-r-2 border-white/10 group-hover/resize:border-white/30"></div>
        </div>
      )}
    </motion.div>
  );
};

export default Window;
