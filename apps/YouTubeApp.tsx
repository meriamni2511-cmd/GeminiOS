
import React, { useState } from 'react';
import { OSContextType } from '../types';
import LoginGate from '../components/LoginGate';

interface YouTubeAppProps {
  os: OSContextType;
}

const YouTubeApp: React.FC<YouTubeAppProps> = ({ os }) => {
  const [search, setSearch] = useState('');
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default placeholder

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    if (search.includes('v=')) {
        const id = search.split('v=')[1]?.split('&')[0];
        if (id) setVideoId(id);
    } else {
        setVideoId('L_jWHffIx5E');
    }
  };

  return (
    <LoginGate os={os}>
      <div className="flex flex-col h-full bg-[#0f0f0f] text-white">
        {/* YouTube Top Bar */}
        <div className="h-14 flex items-center px-4 justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-1 text-red-600">
              <i className="fa-brands fa-youtube text-2xl"></i>
              <span className="font-bold text-lg tracking-tighter text-white">YouTube</span>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 flex">
              <input 
                  className="w-full bg-[#121212] border border-white/10 rounded-l-full px-4 py-1.5 focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
              <button className="bg-white/10 border border-l-0 border-white/10 rounded-r-full px-5 hover:bg-white/20 transition-colors">
                  <i className="fa-solid fa-search text-xs"></i>
              </button>
          </form>

          <div className="flex items-center gap-4 text-lg text-gray-400">
              <i className="fa-solid fa-video hover:text-white cursor-pointer"></i>
              <i className="fa-solid fa-bell hover:text-white cursor-pointer"></i>
              <img 
                src={os.user.avatar} 
                className="w-8 h-8 rounded-full border border-white/10" 
                alt="User"
              />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex gap-6">
          {/* Main Player */}
          <div className="flex-[3] space-y-4">
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5">
                  <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                  />
              </div>
              <div>
                  <h1 className="text-xl font-bold line-clamp-2">Premium Experience with GeminiOS AI Agent integration</h1>
                  <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-800"></div>
                          <div>
                              <p className="text-sm font-bold">GeminiOS Official</p>
                              <p className="text-[10px] text-gray-400">1.2M subscribers</p>
                          </div>
                          <button className="ml-4 bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors">Subscribe</button>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="flex bg-white/10 rounded-full overflow-hidden">
                              <button className="px-4 py-1.5 hover:bg-white/20 border-r border-white/5 text-xs flex items-center gap-2"><i className="fa-solid fa-thumbs-up"></i> 42K</button>
                              <button className="px-4 py-1.5 hover:bg-white/20"><i className="fa-solid fa-thumbs-down"></i></button>
                          </div>
                          <button className="bg-white/10 px-4 py-1.5 rounded-full text-xs hover:bg-white/20 flex items-center gap-2"><i className="fa-solid fa-share"></i> Share</button>
                      </div>
                  </div>
              </div>
          </div>

          {/* Sidebar */}
          <div className="flex-1 space-y-4 min-w-[280px]">
              {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-2 group cursor-pointer">
                      <div className="w-40 aspect-video bg-gray-800 rounded-lg shrink-0 overflow-hidden relative">
                           <img src={`https://picsum.photos/seed/${i + 20}/320/180`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                           <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded">10:45</span>
                      </div>
                      <div className="space-y-1">
                          <p className="text-xs font-bold line-clamp-2 group-hover:text-blue-400 transition-colors">Mastering the Gemini Pro 1.5 API in 2024</p>
                          <p className="text-[10px] text-gray-400">Tech Insider</p>
                          <p className="text-[10px] text-gray-400">420K views • 2 days ago</p>
                      </div>
                  </div>
              ))}
          </div>
        </div>
      </div>
    </LoginGate>
  );
};

export default YouTubeApp;
