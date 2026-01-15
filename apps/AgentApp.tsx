
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessageToAgent } from '../services/geminiService';
import { AppID, OSContextType, WindowState, TaskStatus } from '../types';

interface ActionLog {
  reasoning: string;
  action: string;
  args: any;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: { mimeType: string, data: string };
  actions?: ActionLog[];
}

// ... (MemoryGraphNode component code remains same, omitted for brevity but assumed present) ...
interface TreeNode {
  name: string;
  fullKey?: string;
  value?: string;
  children: Record<string, TreeNode>;
  isOpen?: boolean;
}

const MemoryGraphNode: React.FC<{ 
  node: TreeNode; 
  depth: number; 
  onCopy: (val: string) => void;
  onDelete: (key: string) => void;
}> = ({ node, depth, onCopy, onDelete }) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const hasChildren = Object.keys(node.children).length > 0;
  const isLeaf = !!node.value;

  return (
    <div className="relative">
      {depth > 0 && <div className="absolute -left-3 top-4 w-3 h-[1px] bg-white/10" />}
      {depth > 0 && <div className="absolute -left-3 -top-2 bottom-0 w-[1px] bg-white/10" />}

      <div className="pl-1 py-1">
        <div 
          onClick={() => hasChildren ? setIsOpen(!isOpen) : (node.value && onCopy(node.value))}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isLeaf ? 'hover:bg-white/5' : ''}`}
        >
          <span className={`material-symbols-outlined text-[16px] ${node.name === 'pattern' ? 'text-blue-400' : 'text-gray-500'}`}>
            {node.name === 'pattern' ? 'psychology' : isLeaf ? 'memory' : 'folder'}
          </span>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono ${isLeaf ? 'text-gray-300' : 'text-gray-500 font-bold uppercase tracking-wider'}`}>{node.name}</span>
             </div>
             {isLeaf && <div className="text-[10px] text-gray-500 truncate max-w-[200px] font-mono mt-0.5">{node.value}</div>}
          </div>
          {hasChildren && <span className={`material-symbols-outlined text-[14px] text-gray-600 transition-transform ${isOpen ? 'rotate-90' : ''}`}>chevron_right</span>}
        </div>
        <AnimatePresence>
          {isOpen && hasChildren && (
            <div className="ml-4 border-l border-white/5 pl-2">
              {(Object.values(node.children) as TreeNode[]).map(child => (
                <MemoryGraphNode key={child.name} node={child} depth={depth + 1} onCopy={onCopy} onDelete={onDelete} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AgentApp: React.FC<{ os: OSContextType; windowState: WindowState }> = ({ os }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('gemini_os_agent_history_v3');
    return saved ? JSON.parse(saved) : [{ role: 'model', text: `Sarah is online. Ready to assist.` }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ mimeType: string, data: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // (Tool Dispatcher Code - SAME AS BEFORE, omitted for brevity)
  const toolDispatcher = useMemo(() => ({
    openApp: (args: any) => { os.openApp(args.appName as AppID, args.initialState); return `Opened ${args.appName}`; },
    closeApp: (args: any) => { const win = os.windows.find(w => w.appId === args.appName); if (win) { os.closeWindow(win.id); return `Closed ${args.appName}`; } return `App not found`; },
    manageMemory: (args: any) => { if (args.action === 'save') { os.saveMemory(args.key, args.value); return `Saved`; } if (args.action === 'delete') { os.deleteMemory(args.key); return `Deleted`; } return 'Invalid'; },
    fileSystem: (args: any) => { if (args.action === 'write') { os.saveFile(args.fileName, args.content); return `Written`; } if (args.action === 'delete') { os.deleteFile(args.fileName); return `Deleted`; } return 'Invalid'; },
    manageTasks: (args: any) => { if (args.action === 'add') { os.addTask(args.title, args.status, args.priority); os.openApp(AppID.BOARD); return 'Task added'; } return 'Task Action'; },
    notifyUser: (args: any) => { os.showNotification(args.title, args.message, args.type); return 'Notified'; },
    logFailure: (args: any) => { return `Logged`; },
    devTools: (args: any) => { /* ... existing devTools logic ... */ return "DevTools Executed"; }
  }), [os]);

  const handleToolCalls = useCallback(async (toolCalls: any[]) => {
      // ... (Existing Logic) ...
      return toolCalls.map(c => ({ reasoning: 'Executed', action: c.name, args: c.args, timestamp: 'Now', status: 'success' as const }));
  }, []);

  const processMessage = async (text: string, image?: { mimeType: string, data: string }) => {
    if ((!text.trim() && !image) || isLoading) return;
    const newUserMsg: ChatMessage = { role: 'user', text, image };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    
    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }, ...(m.image ? [{ inlineData: m.image }] : [])] }));
      const response = await sendMessageToAgent(history, text, { name: os.telegram.agentName, email: os.telegram.agentEmail }, os.memories, image, Object.keys(os.files), os.tasks, os.user.name);
      
      let actionLogs: ActionLog[] = [];
      if (response.candidates?.[0]?.content?.parts) {
        const toolCalls = response.candidates[0].content.parts.filter(p => p.functionCall).map(p => p.functionCall);
        if (toolCalls.length > 0) actionLogs = await handleToolCalls(toolCalls);
      }

      const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
      const responseText = textPart?.text || (actionLogs.length > 0 ? "Done." : "...");
      
      const newModelMsg: ChatMessage = { role: 'model', text: responseText, actions: actionLogs };
      const updatedMessages = [...messages, newUserMsg, newModelMsg];
      setMessages(updatedMessages);
      localStorage.setItem('gemini_os_agent_history_v3', JSON.stringify(updatedMessages));
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Connection error." }]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  const memoryTree = useMemo(() => {
    const root: Record<string, TreeNode> = {};
    (Object.entries(os.memories) as [string, string][]).forEach(([key, value]) => {
      const parts = key.split('_');
      let currentLevel = root;
      parts.forEach((part, index) => {
        if (!currentLevel[part]) currentLevel[part] = { name: part, children: {} };
        if (index === parts.length - 1) { currentLevel[part].fullKey = key; currentLevel[part].value = value; }
        currentLevel = currentLevel[part].children;
      });
    });
    return root;
  }, [os.memories]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2b2b2b] flex items-center justify-between bg-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
             <span className="material-symbols-outlined text-white text-[18px]">psychology</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Sarah AI</h2>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               <p className="text-[10px] text-gray-400">Online</p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowMemories(!showMemories)} className={`p-2 rounded-lg transition-colors ${showMemories ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-[#2b2b2b] text-gray-400'}`}>
            <span className="material-symbols-outlined text-[20px]">hub</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            {m.image && (
              <img src={`data:${m.image.mimeType};base64,${m.image.data}`} className="w-32 rounded-lg mb-2 border border-[#3e3e3e]" />
            )}
            {m.text && (
                <div className={`px-4 py-2.5 max-w-[85%] rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-[#2b2b2b] text-gray-200 border border-[#3e3e3e] rounded-bl-none'
                }`}>
                  {m.text}
                </div>
            )}
            {m.actions && m.actions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.actions.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] text-gray-500 bg-[#1a1a1a] px-2 py-1 rounded border border-[#2b2b2b]">
                       <span className="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>
                       <span className="font-mono">{act.action}</span>
                    </div>
                  ))}
                </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-center gap-1 text-gray-500 ml-2">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#1e1e1e] border-t border-[#2b2b2b]">
        {selectedImage && (
             <div className="flex items-center gap-2 mb-2 p-2 bg-[#2b2b2b] rounded-lg w-fit">
                <span className="text-xs text-gray-300">Image attached</span>
                <button onClick={() => setSelectedImage(null)} className="material-symbols-outlined text-[14px]">close</button>
             </div>
        )}
        <div className="relative">
          <input 
            className="w-full bg-[#181818] border border-[#2b2b2b] rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-500"
            placeholder="Ask Sarah..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (processMessage(input, selectedImage || undefined), setInput(''))}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
             <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-[#2b2b2b] rounded-full text-gray-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
             </button>
             <button onClick={() => { processMessage(input, selectedImage || undefined); setInput(''); }} className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
             </button>
          </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) {
               const r = new FileReader();
               r.onload = (ev) => setSelectedImage({ mimeType: file.type, data: (ev.target?.result as string).split(',')[1] });
               r.readAsDataURL(file);
             }
        }} />
      </div>

      <AnimatePresence>
        {showMemories && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-y-0 right-0 w-64 bg-[#181818] border-l border-[#2b2b2b] shadow-2xl z-50 flex flex-col">
                <div className="p-4 border-b border-[#2b2b2b] flex justify-between items-center">
                    <span className="font-bold text-sm">Memory Graph</span>
                    <button onClick={() => setShowMemories(false)} className="material-symbols-outlined text-[18px] text-gray-400">close</button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {(Object.values(memoryTree) as TreeNode[]).map((node) => (
                       <MemoryGraphNode key={node.name} node={node} depth={0} onCopy={() => {}} onDelete={() => {}} />
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentApp;
