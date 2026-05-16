import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  User, 
  Map as MapIcon, 
  Bell, 
  Wallet, 
  LogOut, 
  Power,
  ShieldAlert
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { UserStatus } from '../types';
import { updateProfileStatus } from '../services/store';

import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: 'map' | 'profile' | 'earnings' | 'sos';
  setActiveTab?: (tab: any) => void;
  userStatus?: UserStatus;
  userName?: string;
  onStatusToggle?: () => void;
}

export default function Layout({ 
  children, 
  activeTab = 'map', 
  setActiveTab,
  userStatus,
  userName = 'Guest',
  onStatusToggle
}: LayoutProps) {
  const isOnline = userStatus === UserStatus.ONLINE;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Header handled by Dashboard primarily, but keep a minimal global presence if needed */}
      {/* For now, the Dashboard has its own header. We'll keep Layout clean. */}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar (Swiggy Style) */}
      <nav className="bg-white border-t border-gray-100 flex items-center justify-around px-2 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-[200] relative">
        <TabButton 
          active={activeTab === 'map'} 
          onClick={() => setActiveTab?.('map')}
          icon={<MapIcon size={24} />}
          label="Home"
        />
        <TabButton 
          active={activeTab === 'earnings'} 
          onClick={() => setActiveTab?.('earnings')}
          icon={<Wallet size={24} />}
          label="Earnings"
        />
        <TabButton 
          active={activeTab === 'sos'} 
          onClick={() => setActiveTab?.('sos')}
          icon={<ShieldAlert size={24} className={activeTab === 'sos' ? 'text-red-500' : ''} />}
          label="SOS"
        />
        <TabButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab?.('profile')}
          icon={<User size={24} />}
          label="Account"
        />
      </nav>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 w-full ${
        active ? 'text-gold-600' : 'text-gray-300 hover:text-gray-500'
      }`}
    >
      <div className="relative">
        {icon}
        {active && (
          <motion.div 
            layoutId="activeTabIndicator"
            className="absolute -top-1 -right-1 w-2 h-2 bg-gold-500 rounded-full border-2 border-white shadow-lg shadow-gold-500/50"
          />
        )}
      </div>
      <span className={cn("text-[9px] font-bold uppercase tracking-widest", active ? "text-gray-900" : "text-gray-300")}>
        {label}
      </span>
    </button>
  );
}

