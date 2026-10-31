import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, CheckCircle2, AlertCircle, X, ShieldCheck, Fuel } from 'lucide-react';
import { Order } from '../types';

interface OtpVerificationModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onVerifyAndComplete: (otp: string) => Promise<{ success: boolean; error?: string }>;
  currencySymbol?: string;
}

export default function OtpVerificationModal({
  isOpen,
  order,
  onClose,
  onVerifyAndComplete,
  currencySymbol = '₹'
}: OtpVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const expectedOtp = order.otp || order.delivery_otp || '1234';

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric
    const clean = val.replace(/\D/g, '');
    const nextDigits = [...digits];
    nextDigits[index] = clean.slice(-1);
    setDigits(nextDigits);
    setErrorMessage(null);

    // Auto-focus next input
    if (clean && index < 3) {
      const nextInput = document.getElementById(`delivery-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`delivery-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = digits.join('');
    if (entered.length < 4) {
      setErrorMessage('Please enter the full 4-digit customer delivery OTP.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await onVerifyAndComplete(entered);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid OTP code. Please verify with customer.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseQuickDemoOtp = () => {
    const code = expectedOtp.padStart(4, '0').slice(0, 4);
    setDigits(code.split(''));
    setErrorMessage(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-neutral-950 border-2 border-emerald-500/40 rounded-[36px] p-6 text-white shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <KeyRound size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                  Delivery Handover
                </span>
                <h3 className="text-xl font-display font-black tracking-tight text-white uppercase italic">
                  Verify Customer OTP
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Order Details summary */}
          <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Order ID:</span>
              <span className="font-mono font-bold text-gold-400">{order.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Fuel & Quantity:</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <Fuel size={14} className="text-gold-400" />
                {order.fuelType || order.fuel_type || 'Diesel'} ({order.amount || 25}L)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Total Payout:</span>
              <span className="font-extrabold text-emerald-400 text-sm">
                {currencySymbol}{order.price?.toFixed(0) || '2,400'}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-300 text-center mb-6">
            Ask the recipient for the 4-digit delivery security PIN shown on their app to mark this fuel delivery as <span className="text-emerald-400 font-bold">COMPLETED</span> in Supabase.
          </p>

          {/* 4 Digit OTP Inputs */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`delivery-otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  className="w-14 h-16 text-center text-2xl font-mono font-black bg-neutral-900 border-2 border-white/20 focus:border-emerald-400 rounded-2xl text-white outline-none transition-all focus:ring-4 focus:ring-emerald-500/20"
                />
              ))}
            </div>

            {/* Hint / Helper with test code */}
            <div className="flex items-center justify-between px-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Customer PIN: <span className="font-mono text-gold-400 font-bold">{expectedOtp}</span></span>
              </span>
              <button
                type="button"
                onClick={handleUseQuickDemoOtp}
                className="text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider underline cursor-pointer"
              >
                Auto-Fill PIN
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-4 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-2 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Verifying in Supabase...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify & Mark Completed</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
