
import React from 'react';
import { OSContextType, AppID, FileSystemFile } from '../types';
import { motion } from 'framer-motion';

const FilesApp: React.FC<{ os: OSContextType }> = ({ os }) => {
  // Fix: Explicitly cast the result of Object.entries to allow proper property access on file objects
  const fileEntries = Object.entries(os.files) as [string, FileSystemFile][];

  const handleOpenFile = (name: string) => {
    os.openApp(AppID.NOTEPAD);
    os.showNotification("Opening File", `Neural Agent is loading ${name}...`, "info");
  };

  return (
    <div className="h-full bg-[#0a0c10] text-white flex flex-col">
      <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-500">folder_open</span>
          <h2 className="text-xs font-black uppercase tracking-[0.2em]">Neural Explorer</h2>
        </div>
        <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
           {fileEntries.length} Items Indexed
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-2 no-scrollbar">
        {fileEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10">
             <span className="material-symbols-outlined text-7xl">hard_drive_2</span>
             <p className="text-[11px] font-black mt-6 tracking-[0.4em] uppercase">Storage Empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fileEntries.map(([name, file]) => (
              <motion.div 
                key={name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onDoubleClick={() => handleOpenFile(name)}
                className="p-5 glass rounded-2xl border-white/5 flex items-center gap-4 group cursor-pointer hover:border-primary/40 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                   <span className="material-symbols-outlined text-amber-500 group-hover:text-primary">description</span>
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold truncate">{name}</p>
                   {/* Fix: file.size and file.modified are now correctly typed through the earlier cast */}
                   <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-1">{file.size} • {new Date(file.modified).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleOpenFile(name); }}
                     className="p-2 hover:text-primary transition-colors"
                   >
                     <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); os.deleteFile(name); }}
                     className="p-2 hover:text-red-500 transition-colors"
                   >
                     <span className="material-symbols-outlined text-[18px]">delete</span>
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-3 bg-black/20 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 flex justify-between items-center">
         <span>Encrypted Neural Storage</span>
         <span className="text-emerald-500/50">Ready</span>
      </div>
    </div>
  );
};

export default FilesApp;
