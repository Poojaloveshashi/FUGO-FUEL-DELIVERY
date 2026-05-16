import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  ChevronRight, 
  ShieldCheck, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Wrench
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { setupRecaptcha, signInWithPhone } from '../services/store';
import { ConfirmationResult } from 'firebase/auth';

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate network delay for verification request
    setTimeout(() => {
      if (phoneNumber.length < 12) {
        setError('Invalid identifier. Precision sequence incomplete.');
        setLoading(false);
      } else {
        setStep('otp');
        setLoading(false);
      }
    }, 1500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // This simulation currently allows proceeding. 
    // In a production app, verify real OTP here.
    setTimeout(() => {
      if (otp === '123456' || otp === '000000') {
        onSuccess(); 
      } else {
        setError('Decryption failed. Invalid protocol code.');
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-900/5 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gold-600 rounded-[28px] mx-auto mb-6 flex items-center justify-center shadow-[0_20px_50px_rgba(247,167,10,0.3)] rotate-3">
                <Wrench size={40} className="text-black -rotate-3" />
            </div>
            <h1 className="text-white font-display font-bold text-4xl italic tracking-tighter uppercase mb-2">Fugo Repair</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">Precision Service Protocol</p>
        </div>

        <div className="bg-gray-900/40 border border-white/5 backdrop-blur-2xl p-8 rounded-[40px] shadow-2xl relative">
            <AnimatePresence mode="wait">
                {step === 'phone' ? (
                    <motion.div 
                        key="phone-step"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <h2 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                           <Phone size={18} className="text-gold-500" /> Member Access
                        </h2>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-8 italic">Enter your Indian mobile identification</p>

                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 font-bold text-sm">+</span>
                                <input 
                                    type="tel"
                                    placeholder="91 XXXXX XXXXX"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.startsWith('91') || val === '') setPhoneNumber(val);
                                        else if (phoneNumber === '') setPhoneNumber('91' + val);
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-white focus:outline-none focus:border-gold-500 transition-all font-bold tracking-widest text-lg"
                                    required
                                />
                            </div>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-wider"
                                >
                                    <AlertCircle size={14} /> {error}
                                </motion.div>
                            )}

                            <button 
                                type="submit"
                                disabled={loading || phoneNumber.length < 12}
                                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs shadow-xl active:scale-95"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                    <>Request Access <ChevronRight size={18} /></>
                                )}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="otp-step"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <button 
                            onClick={() => setStep('phone')}
                            className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-6"
                        >
                            <ArrowLeft size={14} /> Re-verify Identity
                        </button>

                        <h2 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                           <ShieldCheck size={18} className="text-gold-500" /> Verification
                        </h2>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-8 italic">Decrypt code sent to +{phoneNumber}</p>

                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <input 
                                type="text"
                                maxLength={6}
                                placeholder="XXXXXX"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-black/40 border border-white/20 rounded-2xl py-6 px-4 text-center text-white focus:outline-none focus:border-gold-500 transition-all font-display text-5xl tracking-[0.2em] italic placeholder:text-gray-800"
                                required
                                autoFocus
                            />

                            <p className="text-center text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">Hint: Enter 123456</p>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-wider"
                                >
                                    <AlertCircle size={14} /> {error}
                                </motion.div>
                            )}

                            <button 
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs shadow-xl active:scale-95"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Complete Decryption'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="mt-12 text-center space-y-4">
            <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest">SECURE TRANSIT PORTAL v1.0 • FUGO PROTOCOL</p>
        </div>
      </motion.div>
    </div>
  );
}
