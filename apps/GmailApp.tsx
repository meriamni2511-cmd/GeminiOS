
import React, { useState } from 'react';
import { OSContextType } from '../types';
import LoginGate from '../components/LoginGate';
import { motion } from 'framer-motion';

interface GmailAppProps {
  os: OSContextType;
}

const GmailApp: React.FC<GmailAppProps> = ({ os }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);

  const emails = [
    { id: 1, from: 'Google Cloud', subject: 'Your project GeminiOS-v2 is ready', date: '10:45 AM', snippet: 'Congratulations! Your new workspace has been successfully provisioned...', isRead: false },
    { id: 2, from: 'Sarah Specialist', subject: 'RE: Advanced Reasoning Protocol', date: '9:20 AM', snippet: 'I have reviewed the logs you sent over. The neural density is within...', isRead: true },
    { id: 3, from: 'Telegram Messenger', subject: 'New login to your account', date: 'Yesterday', snippet: 'Dear Adam, we detected a login from a new device...', isRead: true },
    { id: 4, from: 'YouTube', subject: 'New video from Tech Insider', date: 'Yesterday', snippet: 'Tech Insider just uploaded a new video you might like...', isRead: true },
    { id: 5, from: 'GitHub', subject: '[GeminiOS] Deployment successful', date: 'Dec 15', snippet: 'Workflow run #128 has completed successfully on main...', isRead: true },
  ];

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  return (
    <LoginGate os={os}>
      <div className="flex h-full bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-56 bg-[#181818] flex flex-col border-r border-[#2b2b2b]">
          <div className="p-4">
             <button className="w-full bg-white text-black font-semibold rounded-xl py-3 px-4 hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">edit</span>
                <span>Compose</span>
             </button>
          </div>
          
          <nav className="flex-1 px-2 space-y-0.5">
              {[
                  { id: 'inbox', icon: 'inbox', label: 'Inbox', count: 1 },
                  { id: 'starred', icon: 'star', label: 'Starred', count: 0 },
                  { id: 'sent', icon: 'send', label: 'Sent', count: 0 },
                  { id: 'drafts', icon: 'draft', label: 'Drafts', count: 0 },
                  { id: 'trash', icon: 'delete', label: 'Trash', count: 0 },
              ].map(item => (
                  <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-[#2b2b2b] text-white' : 'hover:bg-[#252525] text-gray-400'}`}
                  >
                      <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-[18px] ${activeTab === item.id ? 'text-blue-400' : ''}`}>{item.icon}</span>
                          {item.label}
                      </div>
                      {item.count > 0 && <span className="text-xs bg-blue-600 px-1.5 rounded-full text-white">{item.count}</span>}
                  </button>
              ))}
          </nav>
          
          <div className="p-4 mt-auto border-t border-[#2b2b2b]">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="material-symbols-outlined text-[16px]">cloud</span>
                  <span>12.4 GB used</span>
              </div>
          </div>
        </div>

        {/* Email List */}
        <div className={`${selectedEmailId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-[#2b2b2b] bg-[#1e1e1e]`}>
            <div className="h-14 border-b border-[#2b2b2b] flex items-center px-4 justify-between shrink-0">
                <span className="font-bold text-sm text-white">Inbox</span>
                <span className="material-symbols-outlined text-gray-500 text-[18px] cursor-pointer hover:text-white">filter_list</span>
            </div>
            <div className="flex-1 overflow-y-auto">
                {emails.map(email => (
                    <div 
                        key={email.id}
                        onClick={() => setSelectedEmailId(email.id)}
                        className={`p-4 border-b border-[#2b2b2b] cursor-pointer hover:bg-[#252525] transition-colors ${selectedEmailId === email.id ? 'bg-[#26282e] border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}`}
                    >
                        <div className="flex justify-between items-baseline mb-1">
                            <span className={`text-sm truncate pr-2 ${!email.isRead ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>{email.from}</span>
                            <span className="text-[10px] text-gray-500 shrink-0">{email.date}</span>
                        </div>
                        <div className={`text-xs mb-1 truncate ${!email.isRead ? 'font-bold text-gray-200' : 'text-gray-400'}`}>{email.subject}</div>
                        <div className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{email.snippet}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Reading Pane */}
        <div className={`${!selectedEmailId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#1e1e1e] relative`}>
            {selectedEmail ? (
                <>
                    {/* Reading Header */}
                    <div className="h-14 border-b border-[#2b2b2b] flex items-center justify-between px-6 shrink-0 bg-[#1e1e1e]">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedEmailId(null)} className="md:hidden material-symbols-outlined text-gray-400">arrow_back</button>
                            <div className="flex gap-2">
                                <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2b2b2b] text-gray-400 hover:text-white" title="Archive"><span className="material-symbols-outlined text-[18px]">archive</span></button>
                                <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2b2b2b] text-gray-400 hover:text-white" title="Delete"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2b2b2b] text-gray-400 hover:text-white" title="Mark Unread"><span className="material-symbols-outlined text-[18px]">mail</span></button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2b2b2b] text-gray-400 hover:text-white"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2b2b2b] text-gray-400 hover:text-white"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
                        </div>
                    </div>

                    {/* Email Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <h2 className="text-xl font-semibold text-white mb-6">{selectedEmail.subject}</h2>
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                    {selectedEmail.from.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{selectedEmail.from}</div>
                                    <div className="text-xs text-gray-400">to me</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">{selectedEmail.date}</div>
                        </div>
                        
                        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line border-t border-[#2b2b2b] pt-6">
                            {`Hi Adam,\n\n${selectedEmail.snippet}\n\nWe are excited to see what you build with the new capabilities. The system has been optimized for low-latency neural operations and enhanced context retention.\n\nPlease check the attached documentation for the new API endpoints.\n\nBest regards,\nThe GeminiOS Team`}
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button className="px-4 py-2 border border-[#3e3e3e] rounded-full text-sm text-gray-300 hover:bg-[#2b2b2b] transition-colors">Reply</button>
                            <button className="px-4 py-2 border border-[#3e3e3e] rounded-full text-sm text-gray-300 hover:bg-[#2b2b2b] transition-colors">Forward</button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <span className="material-symbols-outlined text-6xl opacity-20 mb-4">mail</span>
                    <p className="text-sm">Select an email to read</p>
                </div>
            )}
        </div>
      </div>
    </LoginGate>
  );
};

export default GmailApp;
