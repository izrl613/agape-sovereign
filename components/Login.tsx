
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    onLogin(password);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="glass-card p-12 rounded-[4rem] flex flex-col items-center text-center">
        <h1 className="text-4xl font-black sovereign-gradient-text uppercase tracking-tighter mb-4">AUTHENTICATION REQUIRED</h1>
        <p className="text-slate-400 mb-8">Enter the password to access the Privacy Core.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-8 py-4 mb-4 bg-black/40 border border-white/10 rounded-2xl text-white text-center"
          placeholder="Password"
        />
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl"
        >
          AUTHENTICATE
        </button>
      </div>
    </div>
  );
};

export default Login;
