
import React, { useState } from 'react';
import { OSContextType } from '../types';
import LoginGate from '../components/LoginGate';

interface GmailAppProps {
  os: OSContextType;
}

const GmailApp: React.FC<GmailAppProps> = ({ os }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);

  const emails = [
    { id: 1, from: 'Google Cloud', subject: 'Your project GeminiOS-v2 is ready', date: '10:45 AM', snippet: 'Congratulations! Your new workspace has been successfully provisioned...', isRead: false },
    { id: 2, from: 'Sarah Specialist', subject: 'RE: Advanced Reasoning Protocol', date: '9:20 AM', snippet: 'I have reviewed the logs you sent over. The neural density is within...', isRead: true },
    { id: 3, from: 'Telegram Messenger', subject: 'New login to your account', date: 'Yesterday', snippet: 'Dear Adam, we detected a login from a new device...', isRead: true },
    { id: 4, from: 'YouTube', subject: 'New video from Tech Insider', date: 'Yesterday', snippet: 'Tech Insider just uploaded a new video you might like...', isRead: true },
    { id: 5, from: 'GitHub', subject: '[GeminiOS] Deployment successful', date: 'Dec 15', snippet: 'Workflow run #128 has completed successfully on main...', isRead: true },
  ];

  return (
    <LoginGate os={os}>
      <div className="flex h-full bg-[#111] text-gray-200">
        {/* Sidebar */}
        <div className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col p-4 shrink-0">
          <button className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-4 px-6 flex items-center gap-3 shadow-lg transition-all mb-8 font-bold">
              <i className="fa-solid fa-pencil"></i>
              Compose
          </button>
          
          <div className="space-y-1">
              {[
                  { id: 'inbox', icon: 'fa-inbox', label: 'Inbox', count: 1 },
                  { id: 'starred', icon: 'fa-star', label: 'Starred', count: 0 },
                  { id: 'sent', icon: 'fa-paper-plane', label: 'Sent', count: 0 },
                  { id: 'drafts', icon: 'fa-file', label: 'Drafts', count: 0 },
                  { id: 'spam', icon: 'fa-circle-exclamation', label: 'Spam', count: 12 },
              ].map(item => (
                  <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-full text-sm transition-colors ${activeTab === item.id ? 'bg-blue-600/20 text-blue-400 font-bold' : 'hover:bg-white/5 text-gray-400'}`}
                  >
                      <div className="flex items-center gap-4">
                          <i className={`fa-solid ${item.icon} w-4`}></i>
                          {item.label}
                      </div>
                      {item.count > 0 && <span className="text-[10px]">{item.count}</span>}
                  </button>
              ))}
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
               <div className="flex items-center gap-3 px-4 py-2 opacity-50 text-xs">
                   <i className="fa-solid fa-cloud text-blue-400"></i>
                   <span>12.4 GB / 15 GB</span>
               </div>
          </div>
        </div>

        {/* Main Email View */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 border-b border-white/5 flex items-center px-4 justify-between bg-black/20">
              <div className="flex items-center gap-4 text-gray-400">
                  <i className="fa-solid fa-square-check hover:text-white cursor-pointer"></i>
                  <i className="fa-solid fa-rotate-right hover:text-white cursor-pointer"></i>
                  <i className="fa-solid fa-ellipsis-vertical hover:text-white cursor-pointer"></i>
              </div>
              <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">1-50 of 1,240</span>
                  <button className="p-2 hover:bg-white/5 rounded-full"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
                  <button className="p-2 hover:bg-white/5 rounded-full"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto">
              {emails.map(email => (
                  <div 
                      key={email.id}
                      onClick={() => setSelectedEmail(email.id)}
                      className={`group flex items-center px-4 py-2.5 border-b border-white/5 cursor-pointer transition-colors ${!email.isRead ? 'bg-white/[0.03] text-white font-bold' : 'hover:bg-white/[0.02] text-gray-400'}`}
                  >
                      <div className="flex items-center gap-3 shrink-0 mr-4">
                          <i className="fa-regular fa-square text-gray-600 group-hover:text-gray-400"></i>
                          <i className="fa-regular fa-star text-gray-600 hover:text-yellow-500"></i>
                      </div>
                      <div className="w-48 truncate mr-4">{email.from}</div>
                      <div className="flex-1 truncate">
                          <span className={!email.isRead ? 'text-white' : 'text-gray-300'}>{email.subject}</span>
                          <span className="text-gray-500 font-normal ml-2"> - {email.snippet}</span>
                      </div>
                      
                      {/* Quick Actions and Date container */}
                      <div className="w-32 flex items-center justify-end shrink-0 relative">
                          <div className="text-xs text-gray-500 font-normal group-hover:hidden">
                              {email.date}
                          </div>
                          <div className="hidden group-hover:flex items-center gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); console.log('Reply to', email.from); }}
                                title="Reply" 
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all active:scale-90"
                              >
                                  <i className="fa-solid fa-reply text-[10px]"></i>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); console.log('Forward', email.subject); }}
                                title="Forward" 
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all active:scale-90"
                              >
                                  <i className="fa-solid fa-share text-[10px]"></i>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); console.log('Delete', email.id); }}
                                title="Delete" 
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-red-400 transition-all active:scale-90"
                              >
                                  <i className="fa-solid fa-trash text-[10px]"></i>
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        </div>
      </div>
    </LoginGate>
  );
};

export default GmailApp;
