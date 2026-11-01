import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  MapPin, 
  Navigation, 
  Clock, 
  Volume2, 
  VolumeX, 
  Check, 
  X, 
  Zap, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';
import { ringtoneManager } from '../lib/ringtone';

interface IncomingJobDialogProps {
  order: Order | null;
  onAccept: (orderId: string) => Promise<void> | void;
  onDecline: (orderId: string) => void;
  currencySymbol?: string;
  timeoutSeconds?: number;
}

export default function IncomingJobDialog({
  order,
  onAccept,
  onDecline,
  currencySymbol = '₹',
  timeoutSeconds = 30
}: IncomingJobDialogProps) {
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);
  const [isMuted, setIsMuted] = useState(ringtoneManager.getIsMuted());
  const [accepting, setAccepting] = useState(false);

  const onDeclineRef = useRef(onDecline);
  onDeclineRef.current = onDecline;

  useEffect(() => {
    if (!order) {
      ringtoneManager.stopRinging();
      return;
    }

    // Reset timer when a new order appears
    setTimeLeft(timeoutSeconds);
    setAccepting(false);

    // Start ringing
    ringtoneManager.startRinging();

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(timer);
      ringtoneManager.stopRinging();
    };
  }, [order?.id, timeoutSeconds]);

  // Safely trigger onDecline when countdown finishes, decoupled from render cycle
  useEffect(() => {
    if (order && timeLeft === 0) {
      ringtoneManager.stopRinging();
      onDeclineRef.current(order.id);
    }
  }, [timeLeft, order?.id]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = ringtoneManager.toggleMute();
    setIsMuted(muted);
  };

  const handleAcceptClick = async () => {
    if (!order || accepting) return;
    setAccepting(true);
    ringtoneManager.stopRinging();
    try {
      await onAccept(order.id);
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineClick = () => {
    if (!order) return;
    ringtoneManager.stopRinging();
    onDecline(order.id);
  };

  if (!order) return null;

  const progressPercent = (timeLeft / timeoutSeconds) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-md bg-gray-950 border-2 border-gold-500 rounded-[36px] shadow-[0_0_60px_rgba(247,167,10,0.35)] overflow-hidden relative text-white"
        >
          {/* Top Urgency Header & Ring Animation */}
          <div className="bg-gradient-to-r from-gold-600 via-amber-500 to-yellow-500 px-6 py-4 flex items-center justify-between text-black">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <span className="font-display font-black text-sm uppercase tracking-wider italic">
                Incoming Job Request
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-all text-black"
                title={isMuted ? 'Unmute Ringtone' : 'Mute Ringtone'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
              </button>

              <div className="flex items-center gap-1 font-mono font-bold text-xs bg-black/20 px-3 py-1.5 rounded-full">
                <Clock size={14} />
                <span>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Countdown Progress Line */}
          <div className="w-full h-1.5 bg-gray-800 overflow-hidden">
            <motion.div
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 10 ? 'bg-red-500' : 'bg-gold-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Main Card Body */}
          <div className="p-6 space-y-5">
            {/* Price & Service Banner */}
            <div className="flex items-center justify-between bg-gray-900/90 border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/30 rounded-xl flex items-center justify-center text-gold-400">
                  <Wrench size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">
                    <span>{order.service_type === 'TRANSPORT' ? 'Transport Job' : 'Fuel Delivery'}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${order.service_type === 'TRANSPORT' ? 'bg-purple-900/80 text-purple-300' : 'bg-emerald-900/80 text-emerald-300'}`}>
                      {order.service_type || 'FUEL'}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white uppercase tracking-tight">
                    {order.fuelType || (order.service_type === 'TRANSPORT' ? (order.job_kind || 'VEHICLE_PICKUP') : 'Diesel Delivery')}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">
                  Payout
                </div>
                <div className="text-2xl font-black text-emerald-400 font-display">
                  {currencySymbol}{order.price ? order.price.toFixed(0) : '450'}
                </div>
              </div>
            </div>

            {/* Connected Customer App Source Indicator */}
            {order.source_app && (
              <div className="flex items-center justify-between px-3.5 py-2 bg-blue-950/70 border border-blue-500/40 rounded-xl text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-gray-300">Connected Customer:</span>
                  <span className="font-mono font-bold text-white bg-blue-900/60 px-1.5 py-0.5 rounded text-[10px]">
                    {order.source_app.slice(0, 8)}
                  </span>
                </div>
                <span className="text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                  Live Dispatch
                </span>
              </div>
            )}

            {/* Location & Navigation Details */}
            <div className="space-y-3 bg-gray-900/50 p-4 rounded-2xl border border-gray-800/80">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Location</p>
                  <p className="text-sm font-semibold text-gray-100 truncate">
                    {order.location?.address || 'Phoenix Mall, Gachibowli, Hyderabad'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/80 text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                  <Navigation size={14} className="text-gold-400" />
                  <span>Est. ~1.8 km away</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 justify-end">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Verified Request</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeclineClick}
                disabled={accepting}
                className="col-span-1 bg-gray-900 hover:bg-gray-800 border border-gray-700 active:scale-95 text-gray-300 font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-xs tracking-wider uppercase"
              >
                <X size={18} className="text-red-400" />
                <span>Decline</span>
              </button>

              <button
                type="button"
                onClick={handleAcceptClick}
                disabled={accepting}
                className="col-span-2 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-extrabold py-4 px-6 rounded-2xl shadow-[0_10px_30px_rgba(247,167,10,0.4)] active:scale-95 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm relative overflow-hidden group"
              >
                {accepting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Accepting...</span>
                  </div>
                ) : (
                  <>
                    <Zap size={20} className="fill-black group-hover:scale-110 transition-transform" />
                    <span>Accept</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
