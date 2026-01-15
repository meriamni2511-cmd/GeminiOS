
import React, { useState, useEffect } from 'react';
import { OSContextType } from '../types';
import { motion } from 'framer-motion';

const WeatherApp: React.FC<{ os: OSContextType; location?: string }> = ({ os, location }) => {
  const [city, setCity] = useState(location || 'Kuala Lumpur');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock weather data generator based on city name hash
  const generateWeather = (cityName: string) => {
    const hash = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy'];
    const condition = conditions[hash % conditions.length];
    const temp = 20 + (hash % 15); // 20-35 degrees
    
    return {
      temp,
      condition,
      humidity: 40 + (hash % 50),
      wind: 5 + (hash % 20),
      forecast: [
        { day: 'Tue', temp: temp + 1, icon: conditions[(hash + 1) % conditions.length] },
        { day: 'Wed', temp: temp - 2, icon: conditions[(hash + 2) % conditions.length] },
        { day: 'Thu', temp: temp, icon: conditions[(hash + 3) % conditions.length] },
      ]
    };
  };

  useEffect(() => {
    setLoading(true);
    // Simulate network request
    const timer = setTimeout(() => {
      setData(generateWeather(city));
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [city]);

  // Update city if window prop changes (e.g. AI changes it)
  useEffect(() => {
    if (location) setCity(location);
  }, [location]);

  const getWeatherIcon = (cond: string) => {
    switch(cond) {
      case 'Sunny': return 'fa-sun text-amber-400';
      case 'Cloudy': return 'fa-cloud text-gray-400';
      case 'Rainy': return 'fa-cloud-rain text-blue-400';
      case 'Stormy': return 'fa-bolt text-purple-400';
      case 'Partly Cloudy': return 'fa-cloud-sun text-yellow-400';
      default: return 'fa-sun text-amber-400';
    }
  };

  const getBgGradient = (cond: string) => {
    switch(cond) {
      case 'Sunny': return 'from-blue-400 to-blue-300';
      case 'Cloudy': return 'from-gray-700 to-slate-600';
      case 'Rainy': return 'from-slate-800 to-gray-900';
      case 'Stormy': return 'from-indigo-900 to-purple-900';
      default: return 'from-blue-500 to-cyan-400';
    }
  };

  return (
    <div className={`h-full w-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br ${data ? getBgGradient(data.condition) : 'from-gray-900 to-black'}`}>
       {/* Background Decoration */}
       <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px]"></div>
       
       <div className="p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
             <i className="fa-solid fa-location-dot opacity-70"></i>
             <input 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-lg w-full uppercase tracking-wider placeholder:text-white/50"
             />
          </div>
          <button onClick={() => os.openApp('agent' as any)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
             <i className="fa-solid fa-robot text-xs"></i>
          </button>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
          {loading ? (
             <i className="fa-solid fa-circle-notch animate-spin text-4xl opacity-50"></i>
          ) : (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="text-center"
             >
                <i className={`fa-solid ${getWeatherIcon(data.condition)} text-8xl drop-shadow-2xl mb-4`}></i>
                <h1 className="text-7xl font-black tracking-tighter drop-shadow-lg">{data.temp}°</h1>
                <p className="text-xl font-medium opacity-90 mt-2">{data.condition}</p>
             </motion.div>
          )}
       </div>

       {data && !loading && (
         <div className="p-6 z-10">
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center gap-3">
                  <i className="fa-solid fa-droplet text-blue-300"></i>
                  <div>
                     <p className="text-xs opacity-60">Humidity</p>
                     <p className="font-bold">{data.humidity}%</p>
                  </div>
               </div>
               <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center gap-3">
                  <i className="fa-solid fa-wind text-gray-300"></i>
                  <div>
                     <p className="text-xs opacity-60">Wind</p>
                     <p className="font-bold">{data.wind} km/h</p>
                  </div>
               </div>
            </div>

            <div className="flex justify-between gap-2">
               {data.forecast.map((day: any, i: number) => (
                  <div key={i} className="flex-1 bg-black/20 rounded-xl p-3 flex flex-col items-center gap-2 backdrop-blur-sm">
                     <span className="text-xs font-bold opacity-60">{day.day}</span>
                     <i className={`fa-solid ${getWeatherIcon(day.icon).split(' ')[0]} text-lg`}></i>
                     <span className="font-bold">{day.temp}°</span>
                  </div>
               ))}
            </div>
         </div>
       )}
    </div>
  );
};

export default WeatherApp;
