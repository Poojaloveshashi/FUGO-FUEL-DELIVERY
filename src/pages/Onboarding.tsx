import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  ArrowRight, 
  Briefcase, 
  Fuel,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { UserRole } from '../types';
import { createProfile } from '../services/store';

interface OnboardingProps {
  user: any;
  onComplete: () => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<'info' | 'role'>('info');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (displayName.trim()) setStep('role');
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await createProfile({
        displayName,
        role,
        uid: user.uid,
        email: user.email || '',
        phone: user.phoneNumber || ''
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-gold-500/10 blur-[150px] rounded-full animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-gray-900/60 border border-white/10 backdrop-blur-3xl p-10 rounded-[50px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <Fuel size={200} className="text-white" />
            </div>

            {step === 'info' ? (
                <div className="space-y-8 relative">
                    <div className="space-y-2 text-center">
                        <div className="w-16 h-16 bg-gold-500 rounded-2xl mx-auto flex items-center justify-center mb-6">
                            <User size={32} className="text-black" />
                        </div>
                        <h2 className="text-white font-display font-bold text-3xl italic tracking-tighter uppercase">Fugo Identifier</h2>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.3em]">Establish your delivery handle</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-gray-500 text-[9px] uppercase font-bold tracking-widest ml-4 italic">Display Name / Alias</label>
                        <input 
                            type="text"
                            placeholder="e.g. Commander Smith"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-black/50 border border-white/5 rounded-3xl py-6 px-8 text-white focus:outline-none focus:border-gold-500 transition-all font-bold text-lg tracking-tight"
                        />
                    </div>

                    <button 
                        onClick={handleNext}
                        disabled={!displayName.trim()}
                        className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-30 text-black font-bold py-6 rounded-3xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs shadow-2xl shadow-gold-500/20 active:scale-95 group"
                    >
                        Define Strategy <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            ) : (
                <div className="space-y-8 relative">
                     <div className="space-y-2 text-center">
                        <div className="w-16 h-16 bg-gold-500 rounded-2xl mx-auto flex items-center justify-center mb-6">
                            <Briefcase size={32} className="text-black" />
                        </div>
                        <h2 className="text-white font-display font-bold text-3xl italic tracking-tighter uppercase">Operational Role</h2>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.3em]">Select your theater of operations</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div 
                            onClick={() => setRole(UserRole.CUSTOMER)}
                            className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between group ${role === UserRole.CUSTOMER ? 'border-gold-500 bg-gold-500/10' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === UserRole.CUSTOMER ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/40'}`}>
                                    <Fuel size={24} />
                                </div>
                                <div className="text-left">
                                    <p className={`font-bold uppercase tracking-tight ${role === UserRole.CUSTOMER ? 'text-white' : 'text-gray-500'}`}>Refueling Commander</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">I need high-precision fuel delivery</p>
                                </div>
                            </div>
                            {role === UserRole.CUSTOMER && <CheckCircle2 className="text-gold-500" />}
                        </div>

                        <div 
                            onClick={() => setRole(UserRole.DRIVER)}
                            className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between group ${role === UserRole.DRIVER ? 'border-gold-500 bg-gold-500/10' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === UserRole.DRIVER ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/40'}`}>
                                    <Briefcase size={24} />
                                </div>
                                <div className="text-left">
                                    <p className={`font-bold uppercase tracking-tight ${role === UserRole.DRIVER ? 'text-white' : 'text-gray-500'}`}>Dispatch Elite</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">I am here to facilitate delivery logistics</p>
                                </div>
                            </div>
                            {role === UserRole.DRIVER && <CheckCircle2 className="text-gold-500" />}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button 
                            onClick={() => setStep('info')}
                            className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-6 px-8 rounded-3xl uppercase tracking-widest text-xs transition-all border border-white/5"
                        >
                            Back
                        </button>
                        <button 
                            onClick={handleComplete}
                            disabled={loading}
                            className="flex-1 bg-gold-500 hover:bg-gold-400 text-black font-bold py-6 rounded-3xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs shadow-2xl shadow-gold-500/20 active:scale-95"
                        >
                            {loading ? 'Initializing Interface...' : 'Commit to Protocol'}
                        </button>
                    </div>
                </div>
            )}
        </div>
        
        <p className="mt-8 text-center text-gray-600 text-[9px] font-bold uppercase tracking-[0.4em]">Account Verification: SECURE CHANNEL</p>
      </motion.div>
    </div>
  );
}
