import React from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  Camera, 
  Battery, 
  MapPin, 
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface PermissionsProps {
  onProceed: () => void;
}

export default function Permissions({ onProceed }: PermissionsProps) {
  const permissions = [
    {
      icon: <Bell className="text-pink-500" />,
      title: "Push Notification",
      desc: "Turn on notifications to get updates about your application"
    },
    {
      icon: <Camera className="text-pink-500" />,
      title: "Camera",
      desc: "We need your camera to take pictures or upload documents"
    },
    {
      icon: <Battery className="text-pink-500" />,
      title: "Battery Usage",
      desc: "We need you to allow unrestricted battery usage to connect you to nearby Stores"
    },
    {
      icon: <MapPin className="text-pink-500" />,
      title: "Location",
      desc: "We need your location to connect you to nearby Stores"
    },
    {
      icon: <MapPin className="text-pink-500" />,
      title: "Background Location",
      desc: "We require background location to accurate rider updates and geofence detection"
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 pb-12">
      <div className="mt-12 mb-8 relative">
        <div className="w-48 h-48 bg-orange-50 rounded-full flex items-center justify-center">
            <div className="relative w-24 h-40 bg-white border-[6px] border-gray-900 rounded-[30px] shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-gray-900 rounded-b-xl" />
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <MapPin size={24} className="text-red-500" />
                    <Camera size={24} className="text-red-500" />
                </div>
            </div>
        </div>
      </div>

      <h1 className="text-gray-900 font-bold text-3xl mb-4 text-center">Permissions Required</h1>
      <p className="text-gray-500 text-center mb-10 max-w-sm px-4">
        Grant the required access to continue using the App
      </p>

      <div className="w-full max-w-md space-y-8 px-2">
        {permissions.map((p, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="flex items-start gap-4"
          >
            <div className="mt-1 w-6 flex justify-center">{p.icon}</div>
            <div className="space-y-1">
              <h3 className="text-gray-900 font-bold text-lg">{p.title}</h3>
              <p className="text-gray-400 text-sm leading-tight">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto w-full max-w-md pt-8">
        <button 
          onClick={onProceed}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-pink-200 active:scale-[0.98] transition-all"
        >
          Proceed
        </button>
      </div>
    </div>
  );
}
