
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

  const springConfig = { type: "spring", stiffness: 400, damping: 30, mass: 1 } as const;
  const minimizeConfig = { type: "spring", stiffness: 250, damping: 25, mass: 0.8 } as const;

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
      className={`absolute flex flex-col bg-[#111] rounded-xl overflow-hidden
        ${isActive 
          ? 'shadow-[0_20px_70px_-10px_rgba(0,0,0,0.8)] border border-white/20 ring-1 ring-white/5' 
          : 'shadow-xl border border-white/5 opacity-90'
        } 
        ${isDragging ? 'cursor-grabbing select-none' : 'cursor-default'}
      `}
    >
      {/* Clean Header */}
      <div
        className={`h-10 flex items-center justify-between px-4 bg-[#1a1a1a] border-b border-white/5 select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={onMaximize}
      >
        <div className="flex gap-2 mr-4">
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors" />
          <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors" />
          <button onClick={(e) => { e.stopPropagation(); onMaximize(); }} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors" />
        </div>

        <div className="flex-1 text-center text-[12px] font-medium text-white/70 truncate px-2">
           {windowState.title}
        </div>
        
        <div className="w-12"></div> {/* Spacer for alignment */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-[#0a0a0a]">
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

      {/* Resize Handle */}
      {!windowState.isMaximized && (
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[100] flex items-end justify-end p-1"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="w-2 h-2 rounded-sm bg-white/10 mr-0.5 mb-0.5 hover:bg-white/40 transition-colors"></div>
        </div>
      )}
    </motion.div>
  );
};

export default Window;
