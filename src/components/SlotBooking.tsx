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

interface Slot {
  id: string;
  time: string;
  location: string;
  duration: string;
  break: string;
  available: number;
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
      time: '07:01 pm — 09:00 pm',
      location: 'HYD-NALLAGANDLA NEW',
      duration: '2 h',
      break: '20 mins break',
      available: 27
    },
    {
      id: '2',
      time: '05:01 pm — 07:00 pm',
      location: 'HYD-NALLAGANDLA NEW',
      duration: '2 h',
      break: '20 mins break',
      available: 27
    },
    {
      id: '3',
      time: '02:01 pm — 04:00 pm',
      location: 'HYD-NALLAGANDLA NEW',
      duration: '2 h',
      break: '20 mins break',
      available: 15
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
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 size={48} className="text-green-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500">Your slots have been successfully reserved.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[90] flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Gachibowli</h1>
            <div className="bg-gray-100 p-1 rounded-md">
                <ChevronLeft size={20} className="text-pink-500 rotate-[270deg]" />
            </div>
        </div>
        <div className="flex items-center gap-4">
            <Calendar size={20} className="text-gray-400" />
            <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
        </div>
      </div>

      <div className="p-4 bg-gray-50/50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Review Slots</h2>
        <div className="bg-white px-3 py-1 rounded-full border border-gray-200">
            <span className="text-xs font-bold text-gray-500">{selectedSlots.length} Slots • {selectedSlots.length * 2} h</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-4">
            <div className="bg-gray-100 p-1 rounded-md rotate-90">
                <ChevronLeft size={16} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900">Today</h3>
            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {selectedSlots.length} Slots • {selectedSlots.length * 2} h
            </span>
        </div>

        <div className="space-y-4">
          {slots.map(slot => (
            <div 
              key={slot.id}
              onClick={() => handleToggle(slot.id)}
              className="relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
                <div className="flex justify-between items-start mb-1">
                    <span className="text-lg font-bold text-gray-900">{slot.time}</span>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedSlots.includes(slot.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-200'}`}>
                        {selectedSlots.includes(slot.id) && <Check size={14} className="text-white" />}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-tight">{slot.location}</div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <span>{slot.duration}</span>
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{slot.break}</span>
                    </div>
                </div>
                <div className="absolute top-5 right-14">
                    <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md">
                        {slot.available} Free Slot
                    </span>
                </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleConfirm}
          disabled={selectedSlots.length === 0}
          className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
        >
          Confirm & Book
        </button>
      </div>
    </div>
  );
}
