import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  MapPin, 
  X,
  Calendar,
  Check,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Slot {
  id: string;
  time: string;
  location: string;
  duration: string;
  break: string;
  available: number;
  incentive?: number;
}

interface SlotBookingProps {
  onClose: () => void;
  onBooked: () => void;
}

export default function SlotBooking({ onClose, onBooked }: SlotBookingProps) {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const slots: Slot[] = [
    {
      id: '1',
      time: '02:01pm — 03:00pm',
      location: 'HYD-NALLAGANDLA NEW',
      duration: '1 h',
      break: '10 mins break',
      available: 29,
      incentive: 100
    },
    {
      id: '2',
      time: '03:01pm — 05:00pm',
      location: 'HYD-NALLAGANDLA NEW',
      duration: '2 h',
      break: '20 mins break',
      available: 28,
      incentive: 200
    },
    {
      id: '3',
      time: '12:01pm — 02:00pm',
      location: 'HYD-NALLAGANDLA NEW',
      duration: '2 h',
      break: '20 mins break',
      available: 28,
      incentive: 200
    },
    {
      id: '4',
      time: '07:01pm — 09:00pm',
      location: 'HYD-NALLAGANDLA NEW',
      duration: '2 h',
      break: '20 mins break',
      available: 27,
      incentive: 400
    },
    {
      id: '5',
      time: '05:01pm — 07:00pm',
      location: 'HYD-NALLAGANDLA NEW',
      duration: '2 h',
      break: '20 mins break',
      available: 27,
      incentive: 400
    }
  ];

  const handleToggle = (id: string) => {
    setSelectedSlots(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    setBookingConfirmed(true);
    setTimeout(() => {
      onBooked();
    }, 2000);
  };

  if (bookingConfirmed) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-gold-500/10 rounded-full flex items-center justify-center mb-6 border border-gold-500/50"
        >
          <CheckCircle2 size={48} className="text-gold-500" />
        </motion.div>
        <h2 className="text-2xl font-display font-bold text-white italic uppercase tracking-tighter mb-2">Shift Synchronized</h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Your service slots have been established in the global repair ledger.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-[90] flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold text-gray-900">Gachibowli</h1>
              <ChevronLeft size={16} className="text-purple-600 rotate-[270deg]" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium">2-10/A/2, Gopanapalli Thanda, Rangareddy, H...</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
              <Calendar size={20} />
            </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 py-2">
          {[
            { day: 'Mon', date: '11' },
            { day: 'Tue', date: '12' },
            { day: 'Wed', date: '13' },
            { day: 'Thu', date: '14' },
            { day: 'Fri', date: '15' },
            { day: 'Sat', date: '16', active: true },
            { day: 'Sun', date: '17' },
          ].map(d => (
            <div key={d.date} className="flex flex-col items-center min-w-[40px] py-1">
              <span className={cn("text-[10px] font-bold uppercase mb-1", d.active ? "text-purple-600" : "text-gray-400")}>{d.day}</span>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                d.active ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "bg-gray-50 text-gray-400"
              )}>
                {d.date}
              </div>
              {d.active && <div className="w-full h-0.5 bg-purple-600 mt-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gold-50/50 flex items-center justify-between border-b border-gold-100">
        <h2 className="text-lg font-bold text-gray-900 italic uppercase tracking-tighter">Shift Selection</h2>
        <div className="bg-white px-3 py-1 rounded-full border border-gold-200">
            <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest">{selectedSlots.length} Slots • {selectedSlots.length * 2} h</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-4">
            <div className="bg-gray-100 p-1 rounded-md rotate-90">
                <ChevronLeft size={16} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 uppercase text-sm italic tracking-widest">Today's Duty</h3>
            <span className="bg-gold-100 text-gold-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {selectedSlots.length} Selected
            </span>
        </div>

        <div className="space-y-4">
          {slots.map(slot => (
            <div 
              key={slot.id}
              onClick={() => handleToggle(slot.id)}
              className={`relative bg-white border rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all cursor-pointer ${selectedSlots.includes(slot.id) ? 'border-gold-500 ring-4 ring-gold-500/5' : 'border-gray-100'}`}
            >
                <div className="flex justify-between items-start mb-1">
                    <span className="text-lg font-bold text-gray-900 font-mono">{slot.time}</span>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedSlots.includes(slot.id) ? 'bg-gold-500 border-gold-500' : 'border-gray-200'}`}>
                        {selectedSlots.includes(slot.id) && <Check size={14} className="text-black" />}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{slot.location}</div>
                    {slot.incentive && (
                      <div className="text-xs font-bold text-purple-600 underline decoration-purple-200 underline-offset-4">
                        Earn upto ₹{slot.incentive}
                      </div>
                    )}
                </div>
                <div className="absolute top-5 right-14">
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md">
                        {slot.available} Free
                    </span>
                </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-gray-900">Earn upto ₹{selectedSlots.reduce((acc, id) => acc + (slots.find(s => s.id === id)?.incentive || 0), 0)}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedSlots.length * 2} hours</p>
          </div>
          <button 
            onClick={handleConfirm}
            disabled={selectedSlots.length === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-12 py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
