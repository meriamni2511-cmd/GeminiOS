
import React from 'react';

const AboutApp: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-950/20 p-8 text-center select-text">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl mb-6 animate-pulse">
          <i className="fa-brands fa-windows text-4xl text-white"></i>
      </div>
      
      <h1 className="text-2xl font-black tracking-tighter text-white mb-1">GeminiOS</h1>
      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-4">Version 2.5.1 "Titan"</p>
      
      <div className="max-w-xs space-y-4">
          <p className="text-gray-400 text-xs leading-relaxed">
            A next-generation web-based operating system powered by Gemini Pro AI. 
            Seamlessly integrating remote command protocols and neural agent assistance.
          </p>
          
          <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-gray-500">
                <span>Kernel</span>
                <span className="text-gray-300">React 19.2.3</span>
            </div>
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-gray-500">
                <span>Intelligence</span>
                <span className="text-gray-300">Gemini 3 Pro</span>
            </div>
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-gray-500">
                <span>Uptime</span>
                <span className="text-gray-300">Nominal</span>
            </div>
          </div>
          
          <p className="text-[8px] text-gray-600 font-medium pt-4">
            &copy; 2025 GeminiOS Corporation. All rights reserved. <br/>
            Designed for the future of ambient computing.
          </p>
      </div>
    </div>
  );
};

export default AboutApp;
