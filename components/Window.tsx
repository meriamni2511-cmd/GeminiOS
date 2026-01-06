
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

  // Premium physics configuration
  // Using 'as const' to fix TypeScript inference of 'type' as literal string "spring"
  const springConfig = {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 1,
  } as const;

  // Using 'as const' to fix TypeScript inference of 'type' as literal string "spring"
  const minimizeConfig = {
    type: "spring",
    stiffness: 250,
    damping: 25,
    mass: 0.8,
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50, filter: "blur(10px)" }}
      animate={{ 
        opacity: windowState.isMinimized ? 0 : 1, 
        scale: windowState.isMinimized ? 0.3 : 1,
        y: windowState.isMinimized ? 600 : 0,
        filter: windowState.isMinimized ? "blur(20px)" : "blur(0px)",
        left: windowState.isMaximized ? 0 : windowState.position.x,
        top: windowState.isMaximized ? 0 : windowState.position.y,
        width: windowState.isMaximized ? '100%' : windowState.size.width,
        height: windowState.isMaximized ? 'calc(100% - 64px)' : windowState.size.height,
        zIndex: windowState.zIndex,
        pointerEvents: windowState.isMinimized ? 'none' : 'auto'
      }}
      exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
      transition={isDragging || isResizing ? { duration: 0 } : (windowState.isMinimized ? minimizeConfig : springConfig)}
      onMouseDown={onFocus}
      className={`absolute flex flex-col glass border rounded-3xl overflow-hidden
        ${isActive 
          ? 'shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border-white/20' 
          : 'shadow-xl border-white/5 opacity-90'
        } 
        ${isDragging ? 'cursor-grabbing select-none' : 'cursor-default'}
      `}
    >
      {/* OS Styled Window Header */}
      <div
        className={`h-12 flex items-center justify-between px-5 bg-white/5 border-b border-white/5 select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={onMaximize}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-2 mr-3">
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:brightness-110 active:scale-90 transition-all flex items-center justify-center group"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-black/50">×</span>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onMinimize(); }} 
                className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] hover:brightness-110 active:scale-90 transition-all flex items-center justify-center group"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-black/50">−</span>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onMaximize(); }} 
                className="w-3.5 h-3.5 rounded-full bg-[#27c93f] hover:brightness-110 active:scale-90 transition-all flex items-center justify-center group"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/50">⤢</span>
            </button>
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{windowState.appId}</span>
        </div>
        <div className="text-[13px] font-semibold text-white/80 pointer-events-none truncate max-w-[50%]">
           {windowState.title}
        </div>
        <div className="w-20"></div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {(isDragging || isResizing) && <div className="absolute inset-0 z-50 bg-transparent" />}
        <AnimatePresence mode="wait">
          <motion.div 
            key={windowState.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {!windowState.isMaximized && (
        <div 
          className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-[100] flex items-end justify-end p-1 opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="w-2 h-2 rounded-full bg-white/20 mr-1 mb-1"></div>
        </div>
      )}
    </motion.div>
  );
};

export default Window;
