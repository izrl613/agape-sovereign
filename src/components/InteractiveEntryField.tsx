import React, { useState } from 'react';
import { Shield, ShieldAlert, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractiveEntryFieldProps {
  moduleId: string;
  value: string;
  onChange: (val: string) => void;
  onSave: () => void;
  isSaving: boolean;
  title: string;
  placeholder?: string;
}

export const InteractiveEntryField: React.FC<InteractiveEntryFieldProps> = ({
  moduleId,
  value,
  onChange,
  onSave,
  isSaving,
  title,
  placeholder
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic Validation Logic (Jumbo / Optery style)
  const getValidationState = () => {
    if (!value) return { status: 'idle', message: 'Ready for secure input', color: '#64748B' }; // slate-500
    
    if (moduleId === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return { status: 'invalid', message: 'Invalid email format', color: '#EF4444' };
      return { status: 'valid', message: 'Valid email format', color: '#10B981' };
    }
    
    if (moduleId === 'password') {
      if (value.length < 8) return { status: 'invalid', message: 'Too short (min 8 chars)', color: '#EF4444' };
      if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) return { status: 'warning', message: 'Add uppercase and numbers for strength', color: '#F59E0B' };
      return { status: 'valid', message: 'Strong password pattern', color: '#10B981' };
    }
    
    if (value.length < 3) return { status: 'invalid', message: 'Input too short', color: '#EF4444' };
    return { status: 'valid', message: 'Valid input', color: '#10B981' };
  };

  const validation = getValidationState();
  const isPassword = moduleId === 'password';
  const inputType = isPassword && !showPassword ? 'password' : 'text';

  return (
    <div className="flex flex-col gap-3 w-full">
      <label className="text-xs font-sans font-bold text-slate-300 tracking-wider uppercase flex justify-between items-center">
        <span>{title} Parameter</span>
        <AnimatePresence mode="wait">
          <motion.span 
            key={validation.status}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${validation.color}15`, color: validation.color, border: `1px solid ${validation.color}40` }}
          >
            {validation.message}
          </motion.span>
        </AnimatePresence>
      </label>

      <div className="relative group">
        <motion.div
          animate={{
            boxShadow: isFocused ? `0 0 0 2px ${validation.color}80` : `0 0 0 1px rgba(255,255,255,0.1)`,
            borderColor: isFocused ? validation.color : 'rgba(255,255,255,0.1)'
          }}
          className="relative rounded-xl overflow-hidden bg-[#040914] flex items-center transition-shadow duration-300"
        >
          {/* Status Icon */}
          <div className="pl-4 pr-2 flex items-center justify-center">
            {validation.status === 'idle' && <Shield className="w-5 h-5 text-slate-500" />}
            {validation.status === 'valid' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {validation.status === 'invalid' && <ShieldAlert className="w-5 h-5 text-red-500" />}
            {validation.status === 'warning' && <ShieldAlert className="w-5 h-5 text-amber-500" />}
          </div>

          <input 
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent border-none px-2 py-4 text-white focus:outline-none focus:ring-0 font-mono text-base placeholder:text-slate-600"
            placeholder={placeholder || `Enter secure data for ${title}...`}
            disabled={isSaving}
          />

          {isPassword && (
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pr-4 pl-2 text-slate-400 hover:text-white focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

          {/* Action Button embedded inside the input area like Google forms / modern UI */}
          <div className="pr-2 py-2">
            <button
              onClick={onSave}
              disabled={isSaving || validation.status === 'invalid' || !value}
              className={`
                px-4 py-2 rounded-lg font-sans text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-2
                ${(!value || validation.status === 'invalid') 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                }
              `}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SEALING
                </>
              ) : (
                'UPDATE & SEAL'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
