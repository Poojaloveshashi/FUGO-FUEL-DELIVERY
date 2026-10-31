import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronDown,
  MapPin, 
  X,
  Calendar,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  Clock,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Slot {
  id: string;
  time: string;
  location: string;
  durationHours: number;
  breakText: string;
  available: number;
  incentive: number;
}

interface SlotBookingProps {
  onClose?: () => void;
  onBooked?: () => void;
}

const HYDERABAD_HUBS = [
  { name: 'Gachibowli', address: '2-10/A/2, Gopanapalli Thanda, Rangareddy, Hyderabad' },
  { name: 'Nallagandla', address: 'Near Aparna Sarovar, Nallagandla, Hyderabad' },
  { name: 'Madhapur', address: 'Cyber Towers / Mindspace Hub, Madhapur, Hyderabad' },
  { name: 'Financial District', address: 'WaveRock Tower B, Nanakramguda, Hyderabad' },
  { name: 'Kondapur', address: 'Near Botanical Garden Road, Kondapur, Hyderabad' },
];

export default function SlotBooking({ onClose, onBooked }: SlotBookingProps) {
  const [selectedHub, setSelectedHub] = useState(HYDERABAD_HUBS[0]);
  const [showHubPicker, setShowHubPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('16');
  const [selectedSlots, setSelectedSlots] = useState<string[]>(['4', '5']); // Default pre-selected 7-9pm and 5-7pm as in screenshot
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [filterMode, setFilterMode] = useState<'distance' | 'all'>('distance');

  const calendarDays = [
    { day: 'Mon', date: '11' },
    { day: 'Tue', date: '12' },
    { day: 'Wed', date: '13' },
    { day: 'Thu', date: '14' },
    { day: 'Fri', date: '15' },
    { day: 'Sat', date: '16' },
    { day: 'Sun', date: '17' },
    { day: 'Mon', date: '18' },
  ];

  const slots: Slot[] = [
    {
      id: '1',
      time: '02:01pm — 03:00pm',
      location: selectedHub.name.toUpperCase() + ' HUB',
      durationHours: 1,
      breakText: '10 mins break',
      available: 29,
      incentive: 100
    },
    {
      id: '2',
      time: '03:01pm — 05:00pm',
      location: selectedHub.name.toUpperCase() + ' HUB',
      durationHours: 2,
      breakText: '20 mins break',
      available: 28,
      incentive: 200
    },
    {
      id: '3',
      time: '12:01pm — 02:00pm',
      location: selectedHub.name.toUpperCase() + ' HUB',
      durationHours: 2,
      breakText: '20 mins break',
      available: 28,
      incentive: 200
    },
    {
      id: '4',
      time: '07:01pm — 09:00pm',
      location: selectedHub.name.toUpperCase() + ' HUB',
      durationHours: 2,
      breakText: '20 mins break',
      available: 27,
      incentive: 400
    },
    {
      id: '5',
      time: '05:01pm — 07:00pm',
      location: selectedHub.name.toUpperCase() + ' HUB',
      durationHours: 2,
      breakText: '20 mins break',
      available: 27,
      incentive: 400
    },
    {
      id: '6',
      time: '09:01pm — 11:00pm',
      location: selectedHub.name.toUpperCase() + ' HUB',
      durationHours: 2,
      breakText: '20 mins break',
      available: 27,
      incentive: 500
    }
  ];

  const handleToggle = (id: string) => {
    setSelectedSlots(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const totalEarnings = selectedSlots.reduce((sum, id) => {
    const s = slots.find(slot => slot.id === id);
    return sum + (s?.incentive || 0);
  }, 0);

  const totalHours = selectedSlots.reduce((sum, id) => {
    const s = slots.find(slot => slot.id === id);
    return sum + (s?.durationHours || 0);
  }, 0);

  const handleConfirm = () => {
    setBookingConfirmed(true);
    setTimeout(() => {
      if (onBooked) onBooked();
      else if (onClose) onClose();
      setBookingConfirmed(false);
    }, 2200);
  };

  if (bookingConfirmed) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[500] flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-xl">
        <motion.div 
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mb-6 border-2 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.4)]"
        >
          <CheckCircle2 size={52} className="text-purple-400" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Shift Booked Successfully!</h2>
        <p className="text-purple-300 text-sm font-semibold mb-1">
          {selectedHub.name} • {totalHours} Hours Shift
        </p>
        <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
          Estimated earnings of ₹{totalEarnings} allocated. Report to hub 10 minutes prior to shift start.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col relative overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white z-20">
        <div className="flex items-center gap-3">
          {onClose && (
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowHubPicker(!showHubPicker)}
              className="flex items-center gap-1.5 text-left group"
            >
              <h1 className="text-xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">
                {selectedHub.name}
              </h1>
              <ChevronDown size={18} className="text-purple-600 stroke-[2.5]" />
            </button>
            <p className="text-[11px] text-gray-400 font-medium truncate max-w-[220px]">
              {selectedHub.address}
            </p>

            {/* Hub Selector Dropdown */}
            <AnimatePresence>
              {showHubPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                >
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1.5">
                    Select Hyderabad Zone
                  </p>
                  {HYDERABAD_HUBS.map(hub => (
                    <button
                      key={hub.name}
                      onClick={() => {
                        setSelectedHub(hub);
                        setShowHubPicker(false);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all flex items-start gap-2.5",
                        selectedHub.name === hub.name ? "bg-purple-50 text-purple-900 font-bold" : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      <MapPin size={16} className={selectedHub.name === hub.name ? "text-purple-600 mt-0.5" : "text-gray-400 mt-0.5"} />
                      <div>
                        <div className="text-sm font-bold">{hub.name}</div>
                        <div className="text-[10px] text-gray-400 leading-tight">{hub.address}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors shadow-sm">
            <Calendar size={18} />
          </button>
        </div>
      </div>

      {/* Interactive Date Strip */}
      <div className="bg-white border-b border-gray-100 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 py-2">
          {calendarDays.map(d => {
            const isActive = selectedDate === d.date;
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className="flex flex-col items-center min-w-[42px] py-1 cursor-pointer focus:outline-none"
              >
                <span className={cn(
                  "text-[11px] font-bold uppercase mb-1 transition-colors", 
                  isActive ? "text-purple-600" : "text-gray-400"
                )}>
                  {d.day}
                </span>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                  isActive 
                    ? "bg-purple-600 text-white shadow-md shadow-purple-200 scale-105" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}>
                  {d.date}
                </div>
                {isActive ? (
                  <div className="w-full h-0.5 bg-purple-600 mt-2 rounded-full" />
                ) : (
                  <div className="w-full h-0.5 bg-transparent mt-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Chips Bar (Screenshot Match) */}
      <div className="px-4 py-3 bg-white border-b border-gray-50 flex items-center gap-2">
        <button
          onClick={() => setFilterMode('distance')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
            filterMode === 'distance'
              ? "border-purple-300 bg-purple-50/60 text-purple-700"
              : "border-gray-200 text-gray-600"
          )}
        >
          <span>↑ Low to High Distance</span>
          <X size={13} className="text-purple-600" />
        </button>

        <button
          onClick={() => setFilterMode('all')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
            filterMode === 'all'
              ? "border-purple-300 bg-purple-50/60 text-purple-700"
              : "border-gray-200 text-gray-600"
          )}
        >
          <span>≡ All</span>
        </button>
      </div>

      {/* Slot Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-28">
        {slots.map(slot => {
          const isSelected = selectedSlots.includes(slot.id);
          return (
            <div 
              key={slot.id}
              onClick={() => handleToggle(slot.id)}
              className={cn(
                "relative bg-white border rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer",
                isSelected 
                  ? "border-purple-500 ring-2 ring-purple-100 bg-purple-50/20" 
                  : "border-gray-100 hover:border-gray-200"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                    isSelected ? "bg-purple-600 border-purple-600" : "border-gray-300 bg-white"
                  )}>
                    {isSelected && <Check size={14} className="text-white stroke-[3]" />}
                  </div>

                  <div>
                    <span className="text-base font-bold text-gray-900 tracking-tight">
                      {slot.time}
                    </span>
                    <div className="text-xs font-bold text-purple-600 underline decoration-purple-200 underline-offset-4 mt-0.5">
                      Earn upto ₹{slot.incentive}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="text-emerald-700 bg-emerald-50 text-[11px] font-bold px-2.5 py-1 rounded-md">
                    {slot.available} Free
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Action Bar (Exact match with screenshot) */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-lg font-black text-gray-900">
              Earn upto ₹{totalEarnings}
            </p>
            <p className="text-xs text-gray-500 font-semibold">
              {totalHours} hours
            </p>
          </div>

          <button 
            onClick={handleConfirm}
            disabled={selectedSlots.length === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-600/30 active:scale-95 text-sm"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
