import React from 'react';

const TerminalApp: React.FC = () => {
  return (
    <div className="h-full bg-black text-green-400 font-mono p-4 text-sm overflow-auto">
      <div className="mb-2">GeminiOS Terminal [Version 1.0.0]</div>
      <div className="mb-4">(c) GeminiOS Corporation. All rights reserved.</div>
      
      <div className="flex gap-2">
        <span className="text-blue-400">user@geminios</span>
        <span className="text-white">:</span>
        <span className="text-blue-200">~</span>
        <span className="text-white">$</span>
        <span className="ml-1">neofetch</span>
      </div>
      
      <div className="my-4 flex gap-4">
        <div className="text-purple-500">
          <pre>{`
   .   
  / \\  
  | |  
  |.|  
  |:|  
  |:|  
\`--8--'
          `}</pre>
        </div>
        <div>
           <div><span className="font-bold text-blue-400">OS</span>: GeminiOS x86_64</div>
           <div><span className="font-bold text-blue-400">Host</span>: Web Browser Engine</div>
           <div><span className="font-bold text-blue-400">Kernel</span>: React 18.0</div>
           <div><span className="font-bold text-blue-400">Uptime</span>: Just now</div>
           <div><span className="font-bold text-blue-400">Shell</span>: zsh 5.8</div>
           <div><span className="font-bold text-blue-400">Resolution</span>: 1920x1080</div>
           <div><span className="font-bold text-blue-400">AI</span>: Gemini 2.5 Flash</div>
        </div>
      </div>

      <div className="flex gap-2 items-center animate-pulse">
        <span className="text-blue-400">user@geminios</span>
        <span className="text-white">:</span>
        <span className="text-blue-200">~</span>
        <span className="text-white">$</span>
        <span className="w-2 h-4 bg-gray-500 ml-1"></span>
      </div>
    </div>
  );
};

export default TerminalApp;
