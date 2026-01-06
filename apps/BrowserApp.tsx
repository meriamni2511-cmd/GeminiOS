
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WindowState, OSContextType } from '../types';
import LoginGate from '../components/LoginGate';

interface BrowserAppProps {
    windowState?: WindowState;
    os?: OSContextType;
}

const BrowserApp: React.FC<BrowserAppProps> = ({ windowState, os }) => {
  const [url, setUrl] = useState('https://www.google.com/webhp?igu=1');
  const [inputUrl, setInputUrl] = useState('google.com');
  const [history, setHistory] = useState<string[]>(['https://www.google.com/webhp?igu=1']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (windowState?.appState?.url && windowState.appState.url !== url) {
        const newUrl = windowState.appState.url;
        setUrl(newUrl);
        
        if (newUrl !== history[currentIndex]) {
            const newHistory = history.slice(0, currentIndex + 1);
            newHistory.push(newUrl);
            setHistory(newHistory);
            setCurrentIndex(newHistory.length - 1);
        }

        let display = newUrl
            .replace('https://', '')
            .replace('http://', '')
            .replace('www.', '');
        
        if (display.includes('google.com/search?q=')) {
            try {
                const searchParams = new URL(newUrl).searchParams;
                display = searchParams.get('q') || display;
            } catch(e) {}
        } else if (display.includes('google.com/webhp')) {
            display = 'google.com';
        }
        
        setInputUrl(display);
    }
  }, [windowState?.appState?.url, url, history, currentIndex]);

  const navigateTo = (newUrl: string, addToHistory = true) => {
    setUrl(newUrl);
    if (addToHistory) {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newUrl);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }
    
    if (os && windowState) {
        os.updateWindowState(windowState.id, { url: newUrl });
    }
  };

  const handleNavigate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let target = inputUrl.trim();
    if (!target) return;
    
    const isUrl = target.includes('.') && !target.includes(' ');
    
    let finalUrl = '';
    if (isUrl) {
        finalUrl = target.startsWith('http://') || target.startsWith('https://') 
            ? target 
            : 'https://' + target;
    } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(target)}&igu=1`;
    }
    
    navigateTo(finalUrl);
  };

  const goHome = () => {
    navigateTo('https://www.google.com/webhp?igu=1');
    setInputUrl('google.com');
  };

  const goBack = () => {
    if (currentIndex > 0) {
        const prevUrl = history[currentIndex - 1];
        setCurrentIndex(currentIndex - 1);
        setUrl(prevUrl);
        if (os && windowState) os.updateWindowState(windowState.id, { url: prevUrl });
    }
    setContextMenu(null);
  };

  const goForward = () => {
    if (currentIndex < history.length - 1) {
        const nextUrl = history[currentIndex + 1];
        setCurrentIndex(currentIndex + 1);
        setUrl(nextUrl);
        if (os && windowState) os.updateWindowState(windowState.id, { url: nextUrl });
    }
    setContextMenu(null);
  };

  const handleReload = () => {
    setIsReloading(true);
    const current = url;
    setUrl('about:blank');
    setTimeout(() => {
        setUrl(current);
        setIsReloading(false);
    }, 100);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Position menu exactly where cursor is clicked
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
    setContextMenu(null);
  };

  const copyUrlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      if (os) os.showNotification("URL Copied", "Link saved to clipboard.", "success");
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  if (!os) return null;

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  return (
    <LoginGate os={os}>
      <div 
        ref={containerRef}
        className="flex flex-col h-full bg-white relative overflow-hidden"
        onContextMenu={handleContextMenu}
      >
        {/* Browser Toolbar */}
        <div className="h-14 bg-gray-50 border-b flex items-center px-4 gap-3 shrink-0 z-[10]">
          <div className="flex gap-1 text-gray-500">
             <button 
                onClick={goBack}
                disabled={!canGoBack}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 
                  ${canGoBack 
                    ? 'hover:bg-gray-200 text-gray-700 active:scale-90 active:bg-gray-300' 
                    : 'opacity-20 cursor-not-allowed'}`} 
                title="Back"
             >
               <i className="fa-solid fa-arrow-left text-sm"></i>
             </button>
             <button 
                onClick={goForward}
                disabled={!canGoForward}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 
                  ${canGoForward 
                    ? 'hover:bg-gray-200 text-gray-700 active:scale-90 active:bg-gray-300' 
                    : 'opacity-20 cursor-not-allowed'}`} 
                title="Forward"
             >
               <i className="fa-solid fa-arrow-right text-sm"></i>
             </button>
             <button 
               className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 
                 hover:bg-gray-200 text-gray-700 active:scale-90 active:bg-gray-300
                 ${isReloading ? 'text-blue-500' : ''}`}
               title="Reload"
               onClick={handleReload}
             >
               <i className="fa-solid fa-rotate-right text-sm ${isReloading ? 'animate-spin' : ''}"></i>
             </button>
             <button 
               className="w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-gray-200 text-gray-700 active:scale-90 active:bg-gray-300"
               title="Home"
               onClick={goHome}
             >
               <i className="fa-solid fa-house text-sm"></i>
             </button>
          </div>
          
          <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                     <i className={`fa-solid ${url.startsWith('https') ? 'fa-lock text-emerald-500' : 'fa-circle-info text-gray-400'} text-[10px]`}></i>
                  </div>
                  <input 
                      className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-4 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all shadow-sm"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="Search Google or enter URL"
                  />
              </div>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                title="Navigate"
              >
                <span>Go</span>
                <i className="fa-solid fa-paper-plane text-[10px]"></i>
              </button>
          </form>
          
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:bg-gray-200 w-9 h-9 flex items-center justify-center rounded-lg transition-colors active:bg-gray-300">
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
          </div>
        </div>
        
        {/* Webview Container */}
        <div className="flex-1 bg-white relative overflow-hidden">
          <iframe 
              src={url} 
              className={`w-full h-full border-none transition-opacity duration-300 ${isReloading ? 'opacity-0' : 'opacity-100'}`} 
              title="Browser Content"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          
          {isReloading && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                    <i className="fa-solid fa-circle-notch animate-spin text-blue-500 text-xl"></i>
                    <span className="text-xs text-gray-500 font-medium">Refreshing...</span>
                </div>
             </div>
          )}
        </div>
        
        {/* Enhanced OS Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 5 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 5 }}
               style={{ 
                 top: contextMenu.y, 
                 left: contextMenu.x,
                 transform: 'translate(-5%, -5%)' 
               }}
               className="fixed z-[99999] w-52 glass rounded-2xl border border-white/20 shadow-2xl py-2 text-[11px] font-bold text-white/90 overflow-hidden"
            >
                <button 
                  onClick={goBack} 
                  disabled={!canGoBack} 
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-between transition-colors"
                >
                    <span className="flex items-center gap-3">
                      <i className="fa-solid fa-arrow-left w-4 text-center"></i>
                      Back
                    </span>
                    <span className="text-[9px] text-white/30 font-black">CMD+[</span>
                </button>
                <button 
                  onClick={goForward} 
                  disabled={!canGoForward} 
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-between transition-colors"
                >
                    <span className="flex items-center gap-3">
                      <i className="fa-solid fa-arrow-right w-4 text-center"></i>
                      Forward
                    </span>
                    <span className="text-[9px] text-white/30 font-black">CMD+]</span>
                </button>
                <button 
                  onClick={handleReload} 
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center justify-between transition-colors"
                >
                    <span className="flex items-center gap-3">
                      <i className="fa-solid fa-rotate-right w-4 text-center"></i>
                      Reload
                    </span>
                    <span className="text-[9px] text-white/30 font-black">CMD+R</span>
                </button>
                
                <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
                
                <button 
                  onClick={copyUrlToClipboard} 
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center justify-between transition-colors"
                >
                    <span className="flex items-center gap-3">
                      <i className="fa-solid fa-link w-4 text-center"></i>
                      Copy Link
                    </span>
                </button>
                
                <button 
                  onClick={openInNewTab} 
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center justify-between transition-colors"
                >
                    <span className="flex items-center gap-3 text-blue-400">
                      <i className="fa-solid fa-up-right-from-square w-4 text-center"></i>
                      Open Externally
                    </span>
                </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LoginGate>
  );
};

export default BrowserApp;
