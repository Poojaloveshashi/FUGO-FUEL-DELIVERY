import React from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  Camera, 
  Battery, 
  MapPin, 
  Smartphone,
  ChevronRight,
  Wrench
} from 'lucide-react';

interface PermissionsProps {
  onProceed: () => void;
}

export default function Permissions({ onProceed }: PermissionsProps) {
  const permissions = [
    {
      icon: <Bell className="text-orange-500" />,
      title: "Push Notification",
      desc: "Stay updated on service assignments and emergency repairs"
    },
    {
      icon: <Camera className="text-orange-500" />,
      title: "Camera Access",
      desc: "Required for technician verification and proof of repair"
    },
    {
      icon: <Battery className="text-orange-500" />,
      title: "Battery Optimization",
      desc: "Allow background execution for uninterrupted sync with global repair nodes"
    },
    {
      icon: <MapPin className="text-orange-500" />,
      title: "Geographic Sync",
      desc: "We need your location to assign the nearest repair technician"
    },
    {
      icon: <MapPin className="text-orange-500" />,
      title: "Global Background Sync",
      desc: "Background tracking ensures precision ETA and live transit monitoring"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 pb-12">
      <div className="mt-12 mb-8 relative">
        <div className="w-56 h-56 bg-orange-100 rounded-full flex items-center justify-center border-8 border-white shadow-xl">
            <motion.div 
              animate={{ rotateY: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="relative w-28 h-44 bg-gray-900 border-[8px] border-gray-800 rounded-[35px] shadow-2xl overflow-hidden flex items-center justify-center"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-gray-800 rounded-b-xl" />
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50">
                        <Wrench size={24} className="text-white" />
                    </div>
                    <div className="w-8 h-1 bg-gray-700 rounded-full" />
                    <div className="w-6 h-1 bg-gray-700 rounded-full opacity-50" />
                </div>
            </motion.div>
        </div>
      </div>

      <h1 className="text-gray-900 font-display font-bold text-3xl mb-3 text-center uppercase tracking-tighter italic">Fugo Repair Node</h1>
      <p className="text-gray-500 text-center mb-10 max-w-sm px-4 text-xs font-bold uppercase tracking-[0.2em]">
        Establish Precision Connectivity
      </p>

      <div className="w-full max-w-md space-y-8 px-2 flex-1">
        {permissions.map((p, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="flex items-start gap-5 p-4 bg-white rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="mt-1 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">{p.icon}</div>
            <div className="space-y-1">
              <h3 className="text-gray-800 font-bold text-base leading-tight">{p.title}</h3>
              <p className="text-gray-400 text-[11px] leading-tight font-medium uppercase tracking-wider">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 w-full max-w-md">
        <button 
          onClick={onProceed}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-5 rounded-2xl shadow-2xl shadow-orange-200 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
        >
          Confirm Synchronization
        </button>
      </div>
    </div>
  );
}
