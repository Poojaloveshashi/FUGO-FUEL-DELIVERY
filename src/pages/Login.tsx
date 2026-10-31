import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  ChevronRight, 
  ShieldCheck, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Wrench,
  Zap,
  Truck,
  User,
  CheckCircle2,
  MapPin,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { UserRole } from '../types';
import { fastTestLogin, fastVerifyOtp, fastGoogleLogin } from '../services/store';

interface LoginProps {
  onSuccess?: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [authMode, setAuthMode] = useState<'quick_test' | 'phone_verify'>('quick_test');
  const [phoneNumber, setPhoneNumber] = useState('919876543210');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.DRIVER);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1-Click Fast Test Login (Instant entry for testing Driver or Customer)
  const handleFastTestLogin = async (role: UserRole, displayName: string, phone: string) => {
    setError(null);
    setLoading(true);
    setLoadingType(role);
    try {
      await fastTestLogin(role, displayName, phone);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Fast test login error:', err);
      setError(err?.message || 'Fast test authentication failed. Please retry.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  // Instant code request (no slow artificial delay)
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phoneNumber.length < 10) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }
    // Instant step transition without waiting for slow SMS gateways
    setStep('otp');
    setOtp('123456'); // Pre-fill with fast test OTP for 0-friction validation
  };

  // Instant code verification (< 100ms)
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (!code || code.length < 6) {
      setError('Enter 6-digit verification code');
      return;
    }
    setError(null);
    setLoading(true);
    setLoadingType('otp');
    try {
      await fastVerifyOtp(
        phoneNumber, 
        code, 
        selectedRole, 
        selectedRole === UserRole.DRIVER ? 'Ramesh Kumar (Driver)' : 'Vikram Rao (Customer)'
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Verification failed. Use Fast Test Mode or code 123456.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  // Fast Google Login
  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    setLoadingType('google');
    try {
      await fastGoogleLogin(selectedRole);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError('Google Sign-in failed. Try Fast Test Mode.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold-600/15 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-900/10 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-gold-600 to-gold-400 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-[0_15px_35px_rgba(247,167,10,0.35)] rotate-2">
            <Wrench size={32} className="text-black -rotate-2" />
          </div>
          <h1 className="text-white font-display font-bold text-3xl italic tracking-tight uppercase">
            FUGO REPAIR
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <MapPin size={12} className="text-gold-400" />
            <p className="text-gold-400 text-[10px] font-bold uppercase tracking-widest">
              Hyderabad Operational Zone (Nallagandla & Gachibowli)
            </p>
          </div>
        </div>

        {/* Auth Method Navigation Tabs */}
        <div className="flex p-1 bg-gray-900/80 border border-white/10 rounded-2xl mb-5 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setAuthMode('quick_test')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              authMode === 'quick_test'
                ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap size={14} />
            <span>Fast Test Login (Instant)</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('phone_verify')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              authMode === 'phone_verify'
                ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Phone size={14} />
            <span>Fast Phone OTP</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-gray-950/80 border border-white/10 backdrop-blur-2xl p-6 sm:p-7 rounded-[32px] shadow-2xl relative">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3.5 mb-5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium"
            >
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {authMode === 'quick_test' ? (
              <motion.div
                key="quick-test-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-gold-400" />
                    <h2 className="text-white font-bold text-lg">Instant Verification & Test</h2>
                  </div>
                  <p className="text-gray-400 text-xs">
                    No waiting for slow SMS. 1-click launch into full live app testing.
                  </p>
                </div>

                {/* Driver Test Account Card */}
                <div 
                  onClick={() => !loading && handleFastTestLogin(
                    UserRole.DRIVER, 
                    'Ramesh Kumar (Elite Driver)', 
                    '+91 98765 43210'
                  )}
                  className="group relative p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-black border border-gold-500/30 hover:border-gold-500 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400 group-hover:bg-gold-500 group-hover:text-black transition-colors">
                        <Truck size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-sm">Elite Fuel Driver</h3>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Ready
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5">Ramesh Kumar • Hyderabad Hub</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded-md border border-white/5">
                            📅 Slot Booking
                          </span>
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded-md border border-white/5">
                            📡 Live GPS Ping
                          </span>
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded-md border border-white/5">
                            ⚡ Orders Stream
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-gold-400 font-semibold flex items-center gap-1">
                      {loadingType === UserRole.DRIVER ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-gold-400" />
                          <span>Authenticating Driver...</span>
                        </>
                      ) : (
                        <span>Tap to Launch Driver Mode</span>
                      )}
                    </span>
                    <ChevronRight size={16} className="text-gold-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Customer Test Account Card */}
                <div 
                  onClick={() => !loading && handleFastTestLogin(
                    UserRole.CUSTOMER, 
                    'Vikram Rao (Customer)', 
                    '+91 91234 56789'
                  )}
                  className="group relative p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-black border border-white/10 hover:border-gold-500/60 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-gold-500 group-hover:text-black transition-colors">
                        <User size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-sm">Customer / Vehicle Owner</h3>
                          <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                            Requester
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5">Vikram Rao • Gachibowli, Hyderabad</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded-md border border-white/5">
                            ⛽ Fuel Delivery
                          </span>
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded-md border border-white/5">
                            🔧 Mechanic Service
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 group-hover:text-gold-400 font-semibold flex items-center gap-1 transition-colors">
                      {loadingType === UserRole.CUSTOMER ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-gold-400" />
                          <span>Authenticating Customer...</span>
                        </>
                      ) : (
                        <span>Tap to Launch Customer Mode</span>
                      )}
                    </span>
                    <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 group-hover:text-gold-500 transition-all" />
                  </div>
                </div>

                {/* Google Sign-in Fast Alternative */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95"
                  >
                    {loadingType === 'google' ? (
                      <Loader2 size={16} className="animate-spin text-gold-400" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Fast Google Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="phone-verify-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {step === 'phone' ? (
                  <div>
                    <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                      <Phone size={18} className="text-gold-400" />
                      <span>Fast Mobile Verification</span>
                    </h2>
                    <p className="text-gray-400 text-xs mb-5">
                      Fast instant verification without SMS gateway delay.
                    </p>

                    {/* Role selector */}
                    <div className="mb-4">
                      <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-2">
                        I am logging in as:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRole(UserRole.DRIVER)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            selectedRole === UserRole.DRIVER
                              ? 'border-gold-500 bg-gold-500/10 text-gold-400 shadow-md'
                              : 'border-white/10 bg-black/40 text-gray-400 hover:text-white'
                          }`}
                        >
                          <Truck size={14} />
                          <span>Delivery Driver</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole(UserRole.CUSTOMER)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            selectedRole === UserRole.CUSTOMER
                              ? 'border-gold-500 bg-gold-500/10 text-gold-400 shadow-md'
                              : 'border-white/10 bg-black/40 text-gray-400 hover:text-white'
                          }`}
                        >
                          <User size={14} />
                          <span>Customer</span>
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-2">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 font-bold text-sm">+</span>
                          <input 
                            type="tel"
                            placeholder="91 98765 43210"
                            value={phoneNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setPhoneNumber(val);
                            }}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-3.5 pl-8 pr-4 text-white focus:outline-none focus:border-gold-500 transition-all font-mono text-base"
                            required
                          />
                        </div>

                        {/* Quick Pre-fill Chips */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-gray-500">Fast Presets:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneNumber('919876543210');
                              setSelectedRole(UserRole.DRIVER);
                            }}
                            className="text-[10px] bg-white/5 hover:bg-gold-500/10 text-gray-300 hover:text-gold-400 px-2 py-0.5 rounded-md border border-white/5 transition-colors"
                          >
                            Driver 9876543210
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneNumber('919123456789');
                              setSelectedRole(UserRole.CUSTOMER);
                            }}
                            className="text-[10px] bg-white/5 hover:bg-gold-500/10 text-gray-300 hover:text-gold-400 px-2 py-0.5 rounded-md border border-white/5 transition-colors"
                          >
                            Customer 9123456789
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={loading || phoneNumber.length < 10}
                        className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs shadow-xl active:scale-95"
                      >
                        <span>Send Fast Verification Code</span>
                        <ChevronRight size={16} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={() => setStep('phone')}
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold mb-4"
                    >
                      <ArrowLeft size={14} /> Back to Number
                    </button>

                    <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-gold-400" />
                      <span>Instant Verification</span>
                    </h2>
                    <p className="text-gray-400 text-xs mb-5">
                      Fast verification code for <span className="text-gold-400 font-mono">+{phoneNumber}</span>
                    </p>

                    <div className="space-y-4">
                      {/* OTP Input with auto-fill test helper */}
                      <div>
                        <div className="relative">
                          <input 
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setOtp(val);
                              if (val.length === 6) {
                                handleVerifyOtp(val);
                              }
                            }}
                            className="w-full bg-black/60 border border-gold-500/50 rounded-2xl py-4 px-4 text-center text-white focus:outline-none focus:border-gold-400 transition-all font-mono text-3xl tracking-[0.3em] placeholder:text-gray-700"
                            autoFocus
                          />
                        </div>

                        {/* Fast Test Action Bar */}
                        <div className="flex items-center justify-between mt-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setOtp('123456');
                              handleVerifyOtp('123456');
                            }}
                            className="text-[11px] font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
                          >
                            <KeyRound size={12} />
                            <span>Auto-Fill Code (123456)</span>
                          </button>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Instant Pass
                          </span>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => handleVerifyOtp()}
                        disabled={loading || otp.length !== 6}
                        className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs shadow-xl active:scale-95"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <>
                            <span>Verify & Enter Now</span>
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-gray-500 text-[10px] font-medium tracking-wide">
            HYDERABAD CLUSTER • GACHIBOWLI - NALLAGANDLA
          </p>
          <p className="text-gray-600 text-[9px]">
            Fast Verification Protocol • 0ms Delay Bypass Active
          </p>
        </div>
      </motion.div>
    </div>
  );
}
