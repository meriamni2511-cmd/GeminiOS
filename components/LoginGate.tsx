
import React, { useState } from 'react';
import { OSContextType } from '../types';

interface LoginGateProps {
  os: OSContextType;
  children: React.ReactNode;
}

const LoginGate: React.FC<LoginGateProps> = ({ os, children }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [error, setError] = useState('');

  if (os.user.isAuthenticated) {
    return <>{children}</>;
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'mayasanztech@gmail.com') {
      setStep('password');
      setError('');
    } else {
      setError('Could not find your Google Account');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Adamjck91!') {
      os.setUser({ 
        email: 'mayasanztech@gmail.com', 
        name: 'Adam Jck', 
        isAuthenticated: true,
        avatar: 'https://ui-avatars.com/api/?name=Adam+Jck&background=0D8ABC&color=fff'
      });
    } else {
      setError('Wrong password. Try again.');
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#f0f2f5] dark:bg-[#1a1c1e]">
      <div className="w-[450px] p-10 bg-white dark:bg-[#202124] rounded-lg border border-gray-200 dark:border-white/10 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" className="h-8 mb-4 dark:invert-[0.1]" alt="Google" />
          <h2 className="text-2xl font-normal text-gray-900 dark:text-white">Sign in</h2>
          <p className="text-base text-gray-700 dark:text-gray-300 mt-2">to continue to Google Services</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleNext} className="w-full space-y-4">
            <div className="relative">
              <input
                autoFocus
                type="email"
                placeholder="Email or phone"
                className={`w-full p-3.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:text-white ${error ? 'border-red-500' : 'border-gray-300 dark:border-white/20'}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><i className="fa-solid fa-circle-exclamation"></i> {error}</p>}
            </div>
            <button className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline">Forgot email?</button>
            <div className="pt-8 flex justify-between items-center">
              <button type="button" className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-50/50 p-2 rounded">Create account</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-sm transition-colors">Next</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="w-full flex items-center gap-2 p-1.5 border border-gray-200 dark:border-white/10 rounded-full mb-4">
              <img src="https://ui-avatars.com/api/?name=Adam+Jck" className="w-5 h-5 rounded-full" />
              <span className="text-sm dark:text-gray-200 truncate flex-1">{email}</span>
              <i className="fa-solid fa-chevron-down text-xs mr-2 text-gray-400"></i>
            </div>
            <div className="relative">
              <input
                autoFocus
                type="password"
                placeholder="Enter your password"
                className={`w-full p-3.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:text-white ${error ? 'border-red-500' : 'border-gray-300 dark:border-white/20'}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><i className="fa-solid fa-circle-exclamation"></i> {error}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm dark:text-gray-300">Show password</span>
            </div>
            <div className="pt-8 flex justify-between items-center">
              <button type="button" onClick={() => setStep('email')} className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-50/50 p-2 rounded">Back</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-sm transition-colors">Sign in</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginGate;
