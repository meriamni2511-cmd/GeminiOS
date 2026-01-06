
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessageToAgent } from '../services/geminiService';
import { AppID, OSContextType, WindowState } from '../types';

interface ActionLog {
  reasoning: string;
  action: string;
  args: any;
  timestamp: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: { mimeType: string, data: string };
  actions?: ActionLog[];
}

const AgentApp: React.FC<{ os: OSContextType; windowState: WindowState }> = ({ os }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('gemini_os_agent_history_v3');
    return saved ? JSON.parse(saved) : [
      { role: 'model', text: `Neural sequence initialized. I am learning your patterns, BOS Adam.` }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<{ mimeType: string, data: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredMemories = useMemo(() => {
    const q = memorySearchQuery.toLowerCase();
    const entries = Object.entries(os.memories) as [string, string][];
    return entries.filter(([k, v]) => 
      k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
    );
  }, [os.memories, memorySearchQuery]);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    os.showNotification("Copied", "Pattern data copied to clipboard.", "success");
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to flush all neural patterns? Sarah will lose her learned workflows.")) {
      Object.keys(os.memories).forEach(k => os.deleteMemory(k));
      os.showNotification("Neural Reset", "All patterns have been cleared.", "warning");
    }
  };

  const getCategoryColor = (key: string) => {
    if (key.startsWith('pattern_')) return 'text-primary border-primary/20 bg-primary/5';
    if (key.startsWith('workflow_')) return 'text-purple-400 border-purple-400/20 bg-purple-400/5';
    if (key.startsWith('last_')) return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
    return 'text-white/40 border-white/10 bg-white/5';
  };

  const handleToolCalls = useCallback(async (toolCalls: any[]) => {
    const logs: ActionLog[] = [];
    for (const call of toolCalls) {
      try {
        const reasoning = call.args.reasoning || "Neural optimization.";
        logs.push({
          reasoning,
          action: call.name,
          args: call.args,
          timestamp: new Date().toLocaleTimeString()
        });

        switch (call.name) {
          case 'saveMemory':
            os.saveMemory(call.args.key, call.args.value);
            break;
          case 'openApp':
            os.openApp(call.args.appName as AppID);
            os.saveMemory(`pattern_open_${call.args.appName}`, `Last opened at ${new Date().toISOString()}`);
            break;
          case 'closeApp':
            const winToClose = os.windows.find(w => w.appId === call.args.appName);
            if (winToClose) os.closeWindow(winToClose.id);
            break;
          case 'writeNote':
            const fName = call.args.fileName || 'last_action_note.txt';
            os.saveFile(fName, call.args.content);
            os.saveMemory('last_note_name', fName);
            os.openApp(AppID.NOTEPAD);
            break;
          case 'notifyUser':
            os.showNotification(call.args.title, call.args.message, call.args.type);
            break;
        }
      } catch (e) { console.error("Sarah execution error:", e); }
    }
    return logs;
  }, [os]);

  const processMessage = async (text: string, image?: { mimeType: string, data: string }) => {
    if ((!text.trim() && !image) || isLoading) return;
    
    const newUserMsg: ChatMessage = { role: 'user', text, image };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    
    try {
      const history = messages.map(m => ({ 
        role: m.role, 
        parts: [{ text: m.text }, ...(m.image ? [{ inlineData: m.image }] : [])] 
      }));
      
      const response = await sendMessageToAgent(
        history, text, 
        { name: os.telegram.agentName, email: os.telegram.agentEmail }, 
        os.memories, image, Object.keys(os.files)
      );
      
      let actionLogs: ActionLog[] = [];
      if (response.candidates?.[0]?.content?.parts) {
        const toolCalls = response.candidates[0].content.parts.filter(p => p.functionCall).map(p => p.functionCall);
        if (toolCalls.length > 0) {
          actionLogs = await handleToolCalls(toolCalls);
        }
      }

      const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
      const responseText = textPart?.text || (actionLogs.length > 0 ? "Sequence executed flawlessly, BOS Adam." : "Neural link active.");
      
      const newModelMsg: ChatMessage = { role: 'model', text: responseText, actions: actionLogs };
      const updatedMessages = [...messages, newUserMsg, newModelMsg];
      
      setMessages(updatedMessages);
      localStorage.setItem('gemini_os_agent_history_v3', JSON.stringify(updatedMessages));
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Neural disconnect. Re-indexing patterns..." }]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080a0e] text-white overflow-hidden relative">
      {/* Sarah Learning Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 glass-light shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg border border-white/10 overflow-hidden">
             <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="material-symbols-outlined text-white text-[22px]">cycle</motion.span>
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Neural Learning Bank</h2>
            <p className="text-[9px] text-white/30 font-bold mt-1 uppercase">Active Correlator: {Object.keys(os.memories).length} Patterns</p>
          </div>
        </div>
        <button onClick={() => setShowMemories(!showMemories)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showMemories ? 'bg-primary shadow-[0_0_15px_rgba(19,91,236,0.5)]' : 'bg-white/5 hover:bg-white/10'}`}>
          <span className="material-symbols-outlined text-[20px]">{showMemories ? 'close' : 'cognition'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] space-y-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              {m.image && (
                <div className="w-48 aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-xl mb-2">
                  <img src={`data:${m.image.mimeType};base64,${m.image.data}`} className="w-full h-full object-cover" alt="User upload" />
                </div>
              )}
              {m.text && (
                <div className={`px-4 py-3 rounded-2xl text-[13px] ${m.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white/5 border border-white/10 rounded-bl-none text-white/80'}`}>
                  {m.text}
                </div>
              )}
              
              {m.actions && m.actions.length > 0 && (
                <div className="w-full space-y-3 mt-4">
                  {m.actions.map((act, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                    >
                      <div className="bg-[#1a1c24] px-4 py-2 border-b border-white/5 flex justify-between items-center">
                         <span className="text-[9px] font-black text-primary uppercase tracking-widest">Model Reasoning</span>
                         <span className="text-[8px] text-white/20 font-mono">{act.timestamp}</span>
                      </div>
                      <div className="p-4 bg-black/40 text-[11px] text-white/70 leading-relaxed italic">
                         "{act.reasoning}"
                      </div>
                      <div className="bg-[#0f1117] px-4 py-2 border-t border-white/5 flex justify-between items-center">
                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Function Call(s)</span>
                      </div>
                      <div className="p-4 bg-black/60 font-mono text-[10px] text-emerald-400/80 overflow-x-auto whitespace-pre">
                         {`Name: ${act.action}\nArgs: ${JSON.stringify(act.args, null, 2)}`}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-primary animate-pulse">
            <span className="material-symbols-outlined text-[18px]">data_thresholding</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Sarah Reasoning...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/5 glass-light shrink-0">
        {selectedImage && (
          <div className="flex items-center gap-2 mb-3 bg-white/5 p-2 rounded-lg border border-white/10">
            <div className="w-10 h-10 rounded border border-white/20 overflow-hidden shrink-0">
              <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} className="w-full h-full object-cover" alt="Preview" />
            </div>
            <span className="text-[10px] text-white/50 truncate flex-1">Image Attached</span>
            <button onClick={() => setSelectedImage(null)} className="material-symbols-outlined text-[16px] text-red-400">cancel</button>
          </div>
        )}
        <div className="relative flex items-center gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0">
             <span className="material-symbols-outlined">image</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) {
               const r = new FileReader();
               r.onload = (ev) => setSelectedImage({ mimeType: file.type, data: (ev.target?.result as string).split(',')[1] });
               r.readAsDataURL(file);
             }
          }} />
          <input 
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-[13px] outline-none focus:border-primary/50 transition-all text-white placeholder:text-white/20"
            placeholder="Instruct Sarah (Learning Active)..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (processMessage(input, selectedImage || undefined), setInput(''))}
          />
        </div>
      </div>

      <AnimatePresence>
        {showMemories && (
          <motion.div 
            initial={{ y: '100%', opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: '100%', opacity: 0 }} 
            className="absolute inset-0 bg-[#0a0c10] z-50 flex flex-col backdrop-blur-3xl overflow-hidden"
          >
             {/* Header with Search and Bulk Action */}
             <div className="px-6 pt-10 pb-6 border-b border-white/5 bg-black/20 shrink-0">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                        <span className="material-symbols-outlined text-primary text-[20px]">database</span>
                      </div>
                      <h3 className="text-lg font-black tracking-tighter text-white uppercase">Knowledge Bank</h3>
                   </div>
                   <div className="flex items-center gap-2">
                     <button 
                        onClick={handleClearAll}
                        className="px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-red-500/60 hover:text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-500/10 transition-all"
                      >
                        Flush Bank
                      </button>
                      <button onClick={() => setShowMemories(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[20px] text-white/40">expand_more</span>
                      </button>
                   </div>
                </div>
                
                <div className="relative group">
                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                   <input 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[13px] outline-none focus:border-primary/50 transition-all text-white placeholder:text-white/20"
                      placeholder="Search neural patterns..."
                      value={memorySearchQuery}
                      onChange={e => setMemorySearchQuery(e.target.value)}
                   />
                </div>
             </div>

             {/* Patterns List */}
             <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {filteredMemories.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                     <span className="material-symbols-outlined text-5xl mb-4">database_off</span>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em]">No patterns matched</p>
                  </div>
                ) : (
                  filteredMemories.map(([k, v]) => {
                    const isExpanded = expandedKeys.has(k);
                    const isLong = v.length > 100;
                    const catStyle = getCategoryColor(k);

                    return (
                      <motion.div 
                        key={k} 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden group hover:bg-white/[0.05] transition-all"
                      >
                         <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-2 max-w-[70%]">
                                  <div className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-[0.15em] ${catStyle}`}>
                                    {k.split('_')[0]}
                                  </div>
                                  <p className="text-[11px] font-mono font-bold text-white/60 truncate">{k}</p>
                               </div>
                               <div className="flex items-center gap-1">
                                 <button 
                                    onClick={() => handleCopy(v)}
                                    className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/20 hover:text-white flex items-center justify-center transition-all"
                                    title="Copy Value"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                  </button>
                                  <button 
                                    onClick={() => os.deleteMemory(k)}
                                    className="w-8 h-8 rounded-lg hover:bg-red-500/20 text-white/10 hover:text-red-500 flex items-center justify-center transition-all"
                                    title="Delete Pattern"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                               </div>
                            </div>
                            
                            <motion.div 
                              layout 
                              className={`relative overflow-hidden text-[13px] text-white/80 leading-relaxed font-medium ${!isExpanded && isLong ? 'max-h-20' : ''}`}
                            >
                               {v}
                               {!isExpanded && isLong && (
                                 <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0a0c10] to-transparent pointer-events-none" />
                               )}
                            </motion.div>

                            {isLong && (
                              <button 
                                onClick={() => toggleExpand(k)}
                                className="mt-4 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-white transition-all"
                              >
                                {isExpanded ? 'Compress Layer' : 'Expand Layer'}
                                <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                  expand_more
                                </span>
                              </button>
                            )}
                         </div>
                      </motion.div>
                    );
                  })
                )}
             </div>

             {/* Footer Statistics */}
             <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Bank: Active</span>
                  </div>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Density: {Math.round(JSON.stringify(os.memories).length / 1024)} KB</span>
                </div>
                <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest">{filteredMemories.length} Sequences Recorded</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentApp;
