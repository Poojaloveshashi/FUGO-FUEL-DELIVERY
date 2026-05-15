import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  ChevronRight, 
  ShieldCheck, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Fuel
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { setupRecaptcha, signInWithPhone } from '../services/store';
import { ConfirmationResult } from 'firebase/auth';

interface LoginProps {
  onGuestLogin: () => void;
}

export default function Login({ onGuestLogin }: LoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const verifierRef = useRef<any>(null);

  useEffect(() => {
    // Initialize hidden recaptcha
    const initRecaptcha = async () => {
      if (step === 'phone' && !verifierRef.current) {
          try {
              const verifier = await setupRecaptcha('recaptcha-container');
              verifierRef.current = verifier;
          } catch (err) {
              console.error("Recaptcha init failed", err);
          }
      }
    };
    initRecaptcha();

    return () => {
        if (verifierRef.current) {
            try {
                verifierRef.current.clear();
                verifierRef.current = null;
            } catch (e) {}
        }
    };
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!verifierRef.current) {
          const verifier = await setupRecaptcha('recaptcha-container');
          verifierRef.current = verifier;
      }
      
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await signInWithPhone(formattedPhone, verifierRef.current);
      
      if (result) {
        setConfirmationResult(result);
        setStep('otp');
      } else {
        setError('Security check failed. Please refresh the page and try again.');
        // Clear verifier on fail to retry
        if (verifierRef.current) {
            verifierRef.current.clear();
            verifierRef.current = null;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Ensure your number is in international format (e.g. +1 555...)');
      if (verifierRef.current) {
          try { verifierRef.current.clear(); } catch(e){}
          verifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
        // Auth state change in App.tsx will handle the redirect
      }
    } catch (err: any) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
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
                <Fuel size={40} className="text-black -rotate-3" />
            </div>
            <h1 className="text-white font-display font-bold text-4xl italic tracking-tighter uppercase mb-2">Elite Gate</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">Precision Refueling Protocol</p>
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
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-8 italic">Enter your secure identification number</p>

                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+</span>
                                <input 
                                    type="tel"
                                    placeholder="Country Code + Phone"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\+/g, ''))}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-white focus:outline-none focus:border-gold-500 transition-all font-bold tracking-tight"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={loading || !phoneNumber}
                                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs shadow-xl active:scale-95"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                    <>Verify Identity <ChevronRight size={18} /></>
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
                            <ArrowLeft size={14} /> Back
                        </button>

                        <h2 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                           <ShieldCheck size={18} className="text-gold-500" /> Verification
                        </h2>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-8 italic">Decrypt code sent to +{phoneNumber}</p>

                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <input 
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-2xl py-6 px-4 text-center text-white focus:outline-none focus:border-gold-500 transition-all font-display text-5xl tracking-[0.2em] italic placeholder:text-gray-800"
                                required
                                autoFocus
                            />

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                    <AlertCircle size={14} /> {error}
                                </div>
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
            <button 
                onClick={onGuestLogin}
                className="text-white/40 hover:text-gold-500 transition-colors text-[10px] font-bold uppercase tracking-[0.3em] italic"
            >
                Proceed as Limited Guest
            </button>
            <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest">SECURE TRANSIT PORTAL v1.0 • ELITE PROTOCOL</p>
        </div>
      </motion.div>

      {/* Recaptcha Placeholder */}
      <div id="recaptcha-container" />
    </div>
  );
}
