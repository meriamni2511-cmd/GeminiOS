
import React, { useEffect, useState, useRef } from 'react';
import { OSContextType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface NotepadProps {
  os: OSContextType;
}

const NotepadApp: React.FC<NotepadProps> = ({ os }) => {
  const [content, setContent] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [isSavingCopy, setIsSavingCopy] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [fileName, setFileName] = useState('note.txt');
  const [inputFileName, setInputFileName] = useState('note.txt');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounter = useRef(0);

  // Load simulated file on mount if it exists
  useEffect(() => {
    const file = os.readFile(fileName);
    if (file) setContent(file);
  }, [os, fileName]);

  // Handle outside click for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (editMenuRef.current && !editMenuRef.current.contains(target)) {
        setIsEditMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setContent(newVal);
    os.saveFile(fileName, newVal);
  };

  const handleSaveAction = () => {
    if (!inputFileName.trim()) return;
    const finalName = inputFileName.endsWith('.txt') ? inputFileName : `${inputFileName}.txt`;
    os.saveFile(finalName, content);
    
    if (!isSavingCopy) {
      setFileName(finalName);
    }
    
    setIsSaveAsOpen(false);
    setIsSavingCopy(false);
    setIsMenuOpen(false);
    os.showNotification("File Saved", `${finalName} has been saved successfully.`, "success");
  };

  const handleSaveAll = () => {
    os.saveFile(fileName, content);
    setIsMenuOpen(false);
    os.showNotification("Save All Complete", "All documents synced.", "success");
  };

  const handleSaveToCloud = async () => {
    setIsSavingCloud(true);
    setIsMenuOpen(false);
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const cloudData = JSON.parse(localStorage.getItem('gemini_os_cloud_notes') || '{}');
      cloudData[fileName] = { content, timestamp: new Date().toISOString() };
      localStorage.setItem('gemini_os_cloud_notes', JSON.stringify(cloudData));
      setCloudStatus('Synced');
      os.showNotification("Cloud Sync", "Notes backed up successfully.", "success");
      setTimeout(() => setCloudStatus(null), 3000);
    } catch (e) {
      setCloudStatus('Cloud Error');
      os.showNotification("Sync Failed", "Check connection.", "error");
      setTimeout(() => setCloudStatus(null), 3000);
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleCopy = async () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = content.substring(start, end);
      if (selectedText) await navigator.clipboard.writeText(selectedText);
    }
    setIsEditMenuOpen(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newContent = content.substring(0, start) + text + content.substring(end);
        setContent(newContent);
        os.saveFile(fileName, newContent);
      }
    } catch (err) {
      console.error('Paste failed:', err);
    }
    setIsEditMenuOpen(false);
  };

  // Improved Drag and Drop Handlers using Counter Logic
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Required to allow drop
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Basic check for text-like files
      if (file.type && !file.type.startsWith('text/') && !file.name.match(/\.(txt|md|js|ts|json|html|css|py|rb|c|cpp)$/)) {
        os.showNotification("Unsupported File", "Please drop a text-based document.", "warning");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text !== undefined) {
          setContent(text);
          setFileName(file.name);
          setInputFileName(file.name);
          os.saveFile(file.name, text);
          os.showNotification("File Opened", `Loaded ${file.name} successfully.`, "info");
        }
      };
      reader.onerror = () => os.showNotification("Error", "Could not read file.", "error");
      reader.readAsText(file);
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4] relative group select-text"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Menu Bar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-[#2d2d2d] text-xs border-b border-[#3e3e3e] z-10 select-none">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setIsEditMenuOpen(false);
            }}
            className={`px-3 py-1 rounded transition-colors ${isMenuOpen ? 'bg-white/10' : 'hover:bg-white/10'}`}
          >
            File
          </button>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 mt-1 w-56 bg-[#252526] border border-[#454545] shadow-xl rounded-md py-1 z-20">
                <button onClick={() => { setContent(''); setFileName('untitled.txt'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-1.5 hover:bg-[#094771] transition-colors flex items-center justify-between">
                  <span>New File</span>
                  <span className="opacity-40 text-[10px]">Ctrl+N</span>
                </button>
                <button onClick={() => { setIsSavingCopy(false); setInputFileName(fileName); setIsSaveAsOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-1.5 hover:bg-[#094771] transition-colors flex items-center justify-between">
                  <span>Save As...</span>
                  <span className="opacity-40 text-[10px]">Ctrl+S</span>
                </button>
                <button onClick={handleSaveAll} className="w-full text-left px-4 py-1.5 hover:bg-[#094771] transition-colors flex items-center justify-between">
                  <span>Save All</span>
                  <span className="opacity-40 text-[10px]">Ctrl+Shift+S</span>
                </button>
                <button onClick={handleSaveToCloud} className="w-full text-left px-4 py-1.5 hover:bg-[#094771] transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-cloud text-[10px] text-blue-400"></i>
                  <span>Save to Cloud</span>
                </button>
                <div className="my-1 border-t border-[#454545]"></div>
                <button onClick={() => setIsMenuOpen(false)} className="w-full text-left px-4 py-1.5 hover:bg-[#094771] transition-colors">Exit</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={editMenuRef}>
          <button onClick={() => { setIsEditMenuOpen(!isEditMenuOpen); setIsMenuOpen(false); }} className={`px-3 py-1 rounded transition-colors ${isEditMenuOpen ? 'bg-white/10' : 'hover:bg-white/10'}`}>
            Edit
          </button>
          <AnimatePresence>
            {isEditMenuOpen && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 mt-1 w-48 bg-[#252526] border border-[#454545] shadow-xl rounded-md py-1 z-20">
                <button onClick={handleCopy} className="w-full text-left px-4 py-1.5 hover:bg-[#094771] transition-colors flex items-center justify-between">
                  <span>Copy</span>
                  <span className="opacity-40 text-[10px]">Ctrl+C</span>
                </button>
                <button onClick={handlePaste} className="w-full text-left px-4 py-1.5 hover:bg-[#094771] transition-colors flex items-center justify-between">
                  <span>Paste</span>
                  <span className="opacity-40 text-[10px]">Ctrl+V</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="cursor-default opacity-50 px-3 py-1">View</span>
        
        {isSavingCloud && (
          <div className="ml-auto mr-4 flex items-center gap-2 text-blue-400 animate-pulse">
            <i className="fa-solid fa-circle-notch animate-spin"></i>
            <span className="text-[10px]">Syncing...</span>
          </div>
        )}
        
        {cloudStatus && !isSavingCloud && (
          <div className="ml-auto mr-4 flex items-center gap-2 text-green-400">
            <i className="fa-solid fa-check"></i>
            <span className="text-[10px]">{cloudStatus}</span>
          </div>
        )}
      </div>

      {/* Editor */}
      <textarea 
        id="notepad-editor-main"
        name="notepad-editor-main"
        ref={textareaRef}
        className={`flex-1 bg-transparent p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed transition-opacity duration-300 ${isDraggingOver ? 'opacity-40' : 'opacity-100'}`}
        value={content}
        onChange={handleChange}
        placeholder="Type here or drag a file to open..."
        spellCheck={false}
      />

      {/* Enhanced Drag Overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-4 rounded-xl border-2 border-dashed border-blue-500/50 bg-blue-600/10 backdrop-blur-[4px] flex flex-col items-center justify-center gap-4 shadow-[inset_0_0_100px_rgba(37,99,235,0.1)]">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-20 h-20 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/40 shadow-[0_0_30px_rgba(37,99,235,0.2)]"
              >
                 <i className="fa-solid fa-file-arrow-down text-4xl text-blue-400"></i>
              </motion.div>
              <div className="text-center">
                <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-[11px]">Drop to Open</p>
                <p className="text-blue-400/50 text-[9px] mt-1 font-medium">Supports all text documents</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Action Dialog */}
      {isSaveAsOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#252526] border border-[#454545] rounded-lg shadow-2xl w-full max-w-xs overflow-hidden">
            <div className="px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e] text-xs font-semibold select-none">
              {isSavingCopy ? 'Save a Copy As' : 'Save As'}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="notepad-save-filename" className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Filename</label>
                <input 
                  id="notepad-save-filename"
                  name="notepad-save-filename"
                  autoFocus
                  className="w-full bg-[#3c3c3c] border border-blue-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-white"
                  value={inputFileName}
                  onChange={(e) => setInputFileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveAction()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setIsSaveAsOpen(false); setIsSavingCopy(false); }} className="px-4 py-1.5 text-xs rounded hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleSaveAction} className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors text-white">Save</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Bar */}
      <div className="px-3 py-1 bg-[#007acc] text-white text-[10px] flex justify-between items-center shadow-inner select-none shrink-0">
        <div className="flex gap-4">
          <span className="font-bold">{fileName}</span>
          <span className="opacity-70">UTF-8</span>
          {localStorage.getItem('gemini_os_cloud_notes') && JSON.parse(localStorage.getItem('gemini_os_cloud_notes') || '{}')[fileName] && (
            <span className="flex items-center gap-1.5 opacity-90">
              <i className="fa-solid fa-cloud"></i>
              Cloud Synced
            </span>
          )}
        </div>
        <span className="font-mono">Ln {content.split('\n').length}, Col {content.length}</span>
      </div>
    </div>
  );
};

export default NotepadApp;
