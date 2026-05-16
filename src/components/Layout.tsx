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

  const toggleStatus = async () => {
    if (onStatusToggle) {
      onStatusToggle();
    } else {
      const newStatus = isOnline ? UserStatus.OFFLINE : UserStatus.ONLINE;
      await updateProfileStatus(newStatus);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden font-sans">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-gold-900/20 bg-black/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20">
            <span className="text-black font-display font-bold text-xl italic tracking-tighter">F</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-gold-400 tracking-tight leading-tight uppercase">Fugo Repair</h1>
            <p className="text-[10px] text-gray-500 tracking-[0.2em] font-medium uppercase -mt-0.5">Service Protocol</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
              isOnline 
                ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                : 'bg-red-500/10 border-red-500/50 text-red-500'
            }`}
          >
            <Power size={14} className={isOnline ? 'animate-pulse' : ''} />
            <span className="text-xs font-bold uppercase tracking-widest leading-none">
              {isOnline ? 'On Duty' : 'Off Duty'}
            </span>
          </button>
          
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 border border-gray-800 text-gold-400 hover:bg-gray-800 transition-colors">
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-gray-900/90 backdrop-blur-xl border border-gold-900/30 rounded-full px-4 py-3 gap-8 shadow-2xl z-50">
        <TabButton 
          active={activeTab === 'map'} 
          onClick={() => setActiveTab?.('map')}
          icon={<MapIcon size={24} />}
          label="Map"
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
          label="Profile"
        />
      </nav>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${
        active ? 'text-gold-400 scale-110' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {icon}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute -bottom-1 w-1 h-1 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(247,167,10,0.8)]"
        />
      )}
    </button>
  );
}
