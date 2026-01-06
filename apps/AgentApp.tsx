
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessageToAgent } from '../services/geminiService';
import { sendTelegramMessage } from '../services/telegramService';
import { AppID, OSContextType, WindowState } from '../types';

interface AgentAppProps {
  os: OSContextType;
  windowState: WindowState;
}

const AgentApp: React.FC<AgentAppProps> = ({ os, windowState }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, isRemote?: boolean, memoryInsight?: string }[]>(() => {
    const saved = localStorage.getItem('gemini_os_agent_history');
    return saved ? JSON.parse(saved) : [
      { role: 'model', text: `Neural core active, BOS Adam. Sarah dah standby ni. Ada apa-apa task nak settle ke?` }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'file' | 'memory' | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear current chat? Long-term memories will be preserved.")) {
      const initial = { role: 'model', text: `System buffers cleared. Systems nominal, BOS.` };
      setMessages([initial as any]);
      localStorage.removeItem('gemini_os_agent_history');
      setActiveMenu(null);
    }
  };

  const handleToolCalls = useCallback(async (toolCalls: any[]) => {
    let memoryFeedback = "";
    for (const call of toolCalls) {
      try {
        let result: any = "Done, BOS.";
        switch (call.name) {
          case 'saveMemory':
            os.saveMemory(call.args.key, call.args.value);
            memoryFeedback = `Memory Committed: ${call.args.key}`;
            break;
          case 'deleteMemory':
            os.deleteMemory(call.args.key);
            break;
          case 'openApp':
            os.openApp(call.args.appName as AppID);
            break;
          case 'closeApp':
            const win = os.windows.find(w => w.appId === call.args.appName);
            if (win) os.closeWindow(win.id);
            break;
          case 'getSystemStatus':
            result = JSON.stringify({
              screen: { w: window.innerWidth, h: window.innerHeight },
              windows: os.windows.map(w => ({ id: w.appId, active: !w.isMinimized }))
            });
            break;
        }
      } catch (e) { console.error(e); }
    }
    return { memoryFeedback };
  }, [os]);

  const processMessage = useCallback(async (text: string, isRemote = false, remoteChatId?: number) => {
    if (!text.trim() || isLoading) return;
    if (!isRemote) setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);
    
    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessageToAgent(history, text, { name: os.telegram.agentName, email: os.telegram.agentEmail }, os.memories);
      
      let memoryInsight = "";
      if (response.candidates?.[0]?.content?.parts) {
        const toolCalls = response.candidates[0].content.parts.filter(p => p.functionCall).map(p => p.functionCall);
        if (toolCalls.length > 0) {
          const { memoryFeedback } = await handleToolCalls(toolCalls);
          memoryInsight = memoryFeedback;
        }
      }

      const responseText = response.text || "Sarah dah settle tugas tu, BOS.";
      setMessages(prev => [...prev, { role: 'model', text: responseText, memoryInsight }]);
      if (isRemote && remoteChatId && os.telegram.botToken) await sendTelegramMessage(os.telegram.botToken, remoteChatId, responseText);
      localStorage.setItem('gemini_os_agent_history', JSON.stringify([...messages, { role: 'user', text }, { role: 'model', text: responseText, memoryInsight }]));
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Signal interference detected. Systems stable." }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, os, handleToolCalls]);

  const handleSend = () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    processMessage(msg);
  };

  const memoriesList = Object.entries(os.memories);

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] text-white font-body overflow-hidden">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/2 backdrop-blur-xl border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
             <i className="fa-solid fa-sparkles text-[10px]"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-tighter text-white/90 leading-tight">{os.telegram.agentName}</span>
            <span className="text-[7px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Neural Core v2.5</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'memory' ? null : 'memory')}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${activeMenu === 'memory' ? 'bg-primary text-white' : 'hover:bg-white/5 text-gray-500'}`}
          >
             <i className="fa-solid fa-brain text-xs"></i>
          </button>
          <button onClick={() => os.minimizeWindow(windowState.id)} className="w-7 h-7 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-500 transition-colors">
            <i className="fa-solid fa-minus text-xs"></i>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Memory Core Visualization Overlay */}
        <AnimatePresence>
          {activeMenu === 'memory' && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute inset-0 z-50 glass border-l border-white/10 flex flex-col p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-primary uppercase tracking-widest">Neural Bank</h3>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Persistent Contextual Memory</p>
                </div>
                <button onClick={() => setActiveMenu(null)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                  <i className="fa-solid fa-times text-xs"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-8">
                {memoriesList.length > 0 ? memoriesList.map(([key, value]) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={key} 
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 group relative hover:border-primary/30 transition-all"
                  >
                    <button onClick={() => os.deleteMemory(key)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-opacity">
                      <i className="fa-solid fa-circle-xmark text-[10px]"></i>
                    </button>
                    <span className="text-[7px] font-black text-primary/70 uppercase tracking-widest block mb-1">{key.replace(/_/g, ' ')}</span>
                    <p className="text-[10px] leading-relaxed text-gray-300 font-medium">{value}</p>
                  </motion.div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-6">
                    <i className="fa-solid fa-microchip text-4xl mb-4"></i>
                    <p className="text-[10px] font-bold uppercase tracking-widest">No long-term insights recorded yet.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-6 border-t border-white/5">
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <i className="fa-solid fa-shield-halved text-primary text-xs"></i>
                    <p className="text-[8px] text-primary font-bold uppercase tracking-widest">E2E Encrypted Storage Node Active</p>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed shadow-lg ${
                m.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none border border-white/10' 
                  : 'glass-light text-gray-200 rounded-bl-none border border-white/5'
              }`}>
                {m.text}
                
                {m.memoryInsight && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center gap-2 text-primary font-bold">
                    <i className="fa-solid fa-sparkles text-[8px] neural-glow"></i>
                    <span className="text-[7px] uppercase tracking-widest italic">{m.memoryInsight}</span>
                  </div>
                )}
              </div>
              <span className="mt-1.5 text-[6px] text-gray-600 font-black uppercase tracking-widest px-1">
                {m.role === 'user' ? 'BOS Adam' : os.telegram.agentName}
              </span>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="glass-light rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                  <span className="text-[8px] text-primary/70 font-black uppercase tracking-widest">Reasoning</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-3 bg-white/2 border-t border-white/5 shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-2">
           <button onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 text-gray-400">
             <i className="fa-solid fa-plus text-xs"></i>
           </button>
           <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 flex items-center focus-within:border-primary/50 transition-all">
             <input 
               type="text" 
               className="w-full bg-transparent border-none py-2 text-xs focus:ring-0 placeholder:text-gray-700" 
               placeholder="Instruct Sarah..."
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
             />
             <button onClick={handleSend} disabled={isLoading || !input.trim()} className="text-primary disabled:opacity-20 transition-all ml-2">
               <i className="fa-solid fa-paper-plane text-xs"></i>
             </button>
           </div>
        </div>

        {/* File Quick Menu */}
        <AnimatePresence>
          {activeMenu === 'file' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 left-3 w-40 glass rounded-2xl border border-white/10 shadow-2xl py-2 overflow-hidden"
            >
              <button onClick={handleClearChat} className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center justify-between">
                <span>Clear Chat</span>
                <i className="fa-solid fa-trash text-[8px]"></i>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgentApp;
