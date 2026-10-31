import React, { useState, useEffect } from 'react';
import { subscribeToAuth, subscribeToUserProfile } from './services/store';
import { UserProfile, UserRole, UserStatus } from './types';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Permissions from './pages/Permissions';
import SlotBooking from './components/SlotBooking';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  ShieldAlert, 
  AlertTriangle,
  User,
  ArrowRight,
  PlayCircle,
  Gift,
  Check
} from 'lucide-react';
import { createSOS, createProfile } from './services/store';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'profile' | 'earnings' | 'sos'>('map');
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [sosStatus, setSosStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = subscribeToAuth((u) => {
      setUser(u);
      setAuthChecked(true);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubProfile = subscribeToUserProfile(user.uid, (p) => {
        setProfile(p);
        setLoading(false);
      });
      return () => unsubProfile();
    }
  }, [user]);

  if (!authChecked) {
    return <Splash />;
  }

  // Not logged in -> Show Login
  if (!user) {
    return <Login onSuccess={() => {
      // User state will automatically update via subscribeToAuth listener
    }} />;
  }

  // Show Permissions Screen if needed
  if (showPermissions && !permissionGranted) {
    return <Permissions onProceed={() => setPermissionGranted(true)} />;
  }

  // Logged in but profile still loading
  if (loading && !profile) {
    return <Splash />;
  }

  // Logged in but no profile (and loading finished) -> Show Onboarding
  if (!profile) {
     return <Onboarding user={user} onComplete={() => setLoading(true)} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      userStatus={profile.status}
      userName={profile.displayName}
    >
      {activeTab === 'map' && <Dashboard profile={profile} />}
      {activeTab === 'profile' && <ProfilePage profile={profile} />}
      {activeTab === 'earnings' && (
        <SlotBooking 
          onClose={() => setActiveTab('map')} 
          onBooked={() => setActiveTab('map')} 
        />
      )}
      {activeTab === 'sos' && (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-12 bg-black">
           <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: ["0 0 40px rgba(220,38,38,0.2)", "0 0 80px rgba(220,38,38,0.6)", "0 0 40px rgba(220,38,38,0.2)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-56 h-56 bg-red-600 rounded-full flex items-center justify-center border-[12px] border-red-500/20 relative"
           >
              <ShieldAlert size={100} className="text-white" />
              <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-ping" />
           </motion.div>

           <div className="space-y-6">
              <h2 className="text-5xl font-display font-bold text-white tracking-tighter italic uppercase">Panic Protocol</h2>
              <div className="space-y-2">
                <p className="text-red-500 font-bold uppercase tracking-[0.3em] text-xs">Priority One Signal</p>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">Broadcast your location to all active Elite Drivers for immediate retrieval or road-side assistance.</p>
              </div>
           </div>

           {sosStatus && (
             <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-3 rounded-2xl text-xs font-mono font-bold">
               {sosStatus}
             </div>
           )}

            <button 
              onClick={async () => {
                try {
                  if (profile.location) {
                    await createSOS(profile.location);
                    setSosStatus("SOS SIGNAL TRANSMITTED. ELITE UNITS NOTIFIED.");
                    setTimeout(() => setSosStatus(null), 5000);
                  } else {
                    setSosStatus("LOCATION NOT AVAILABLE. CHECK PERMISSIONS.");
                    setTimeout(() => setSosStatus(null), 5000);
                  }
                } catch (err) {
                  console.error("SOS Initiation failed", err);
                  setSosStatus("SOS TRANSMISSION FAILED. RETRY.");
                  setTimeout(() => setSosStatus(null), 5000);
                }
              }}
              className="w-full max-w-sm bg-red-600 hover:bg-black hover:text-red-600 hover:border-red-600 border-4 border-transparent text-white font-extrabold py-8 rounded-[2.5rem] text-2xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] tracking-widest active:scale-95 transition-all group"
            >
             <span className="flex items-center justify-center gap-4">
                <AlertTriangle size={32} className="group-hover:animate-bounce" />
                INITIATE SOS
             </span>
           </button>
        </div>
      )}
    </Layout>
  );
}

function Splash() {
  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center">
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 bg-gold-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-gold-500/40 mb-8"
      >
        <Wrench size={48} className="text-black" />
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display font-bold text-3xl text-gold-400 italic tracking-[0.2em]"
      >
        FUGO REPAIR
      </motion.h1>
      <div className="mt-8 w-48 h-1 bg-gray-900 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-full h-full bg-gold-500 shadow-[0_0_10px_#f7a70a]"
        />
      </div>
    </div>
  );
}
