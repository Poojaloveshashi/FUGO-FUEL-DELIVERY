import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  ChevronRight, 
  LogOut, 
  Shield, 
  CreditCard,
  MessageSquare,
  HelpCircle,
  Truck,
  Fuel
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';

interface ProfileProps {
  profile: UserProfile;
}

export default function Profile({ profile }: ProfileProps) {
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'Personal Details':
        return (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gold-900/10 p-6 rounded-3xl space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Display Name</label>
                <p className="text-white font-medium pl-1">{profile.displayName || 'Luxury User'}</p>
              </div>
              <div className="h-px bg-gray-800" />
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Unique Identifier</label>
                <p className="text-white font-mono text-xs pl-1">{profile.uid}</p>
              </div>
              <div className="h-px bg-gray-800" />
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Active Role</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                  <p className="text-gold-400 font-bold uppercase text-[10px] tracking-widest">{profile.role}</p>
                </div>
              </div>
            </div>
            <button className="w-full bg-gold-500 text-black font-bold py-4 rounded-2xl shadow-lg shadow-gold-500/10 transition-all active:scale-95">
              Update Profile Data
            </button>
          </div>
        );
      case 'Payment Methods':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800 to-black border border-gold-900/20 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <CreditCard size={32} className="text-gold-500" />
              </div>
              <div className="mt-12">
                <p className="text-gold-500 font-mono tracking-[0.3em] text-lg">•••• •••• •••• 4212</p>
                <div className="flex justify-between items-end mt-8">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Holder</p>
                    <p className="text-white font-bold">{profile.displayName?.toUpperCase() || 'ELITE GUEST'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Expires</p>
                    <p className="text-white font-bold">12/28</p>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full bg-transparent border-2 border-dashed border-gray-800 text-gray-500 font-bold py-4 rounded-2xl hover:border-gold-900/50 hover:text-gold-500 transition-all">
              + Add New Payment Method
            </button>
          </div>
        );
      case 'Support Center':
        return (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gold-900/10 p-6 rounded-3xl text-center">
              <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gold-500/30">
                <MessageSquare className="text-gold-400" size={28} />
              </div>
              <h4 className="text-white font-bold mb-2">Live Concierge Support</h4>
              <p className="text-gray-500 text-sm mb-6 px-4 leading-relaxed">Our elite support team is ready to assist you with your refueling needs 24/7.</p>
              <button className="w-full bg-gold-500 text-black font-bold py-4 rounded-2xl active:scale-95 transition-all">
                Initiate Chat
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black border border-gray-800 p-4 rounded-2xl text-center">
                <HelpCircle className="text-gray-500 mx-auto mb-2" size={20} />
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">FAQ</p>
              </div>
              <div className="bg-black border border-gray-800 p-4 rounded-2xl text-center">
                <Shield className="text-gray-500 mx-auto mb-2" size={20} />
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Privacy</p>
              </div>
            </div>
          </div>
        );
      case 'Global Settings':
        return (
          <div className="space-y-4">
            <SettingToggle label="Push Notifications" active />
            <SettingToggle label="Location Services" active />
            <SettingToggle label="Automatic Payments" active={false} />
            <SettingToggle label="Analytics Protocol" active />
            <SettingToggle label="Priority Routing" active />
          </div>
        );
      default:
        return (
          <>
            <section className="space-y-3">
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest pl-4 mb-3">Account Intelligence</h3>
              
              <ProfileItem 
                  icon={<Shield className="text-blue-400" />} 
                  label="Personal Details"
                  sub="Security & Identity"
                  onClick={() => setActiveSection('Personal Details')}
              />
              <ProfileItem 
                  icon={<CreditCard className="text-gold-400" />} 
                  label="Payment Methods"
                  sub="Mastercard •••• 4212"
                  onClick={() => setActiveSection('Payment Methods')}
              />
              <ProfileItem 
                  icon={<MessageSquare className="text-purple-400" />} 
                  label="Support Center"
                  sub="Concierge is active"
                  onClick={() => setActiveSection('Support Center')}
              />
            </section>

            <section className="space-y-3">
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest pl-4 mb-3">System Preferences</h3>
              
              <ProfileItem 
                  icon={<Settings className="text-gray-400" />} 
                  label="Global Settings"
                  sub="App configuration"
                  onClick={() => setActiveSection('Global Settings')}
              />
              <ProfileItem 
                  icon={<HelpCircle className="text-green-400" />} 
                  label="Legal & Privacy"
                  sub="Terms of Service"
                  onClick={() => {}}
              />
            </section>

            <button 
              onClick={() => auth.signOut()}
              className="w-full mt-8 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-5 rounded-3xl flex items-center justify-center gap-3 transition-all border border-red-500/20"
            >
              <LogOut size={20} />
              <span>Terminate Session</span>
            </button>
          </>
        );
    }
  };

  return (
    <div className="p-6 pb-24 space-y-8 overflow-y-auto h-full bg-black no-scrollbar">
      <header className={`flex flex-col items-center pt-8 transition-all duration-500 ${activeSection ? 'scale-75 opacity-50' : 'opacity-100'}`}>
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-[40px] bg-gradient-to-tr from-gold-600 to-gold-400 p-0.5">
                <div className="w-full h-full bg-black rounded-[39px] flex items-center justify-center overflow-hidden">
                    <User size={56} className="text-gold-500" />
                </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gold-500 text-black p-2 rounded-2xl shadow-xl border-4 border-black">
                {profile.role === 'driver' ? <Truck size={18} /> : <Fuel size={18} />}
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight italic">
            {profile.displayName || 'Luxury User'}
          </h2>
          <p className="text-gold-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            Verified {profile.role}
          </p>
      </header>

      <div className="relative pt-2">
        {activeSection && (
          <button 
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 mb-6 text-gold-500 text-[10px] font-bold uppercase tracking-widest pl-2 bg-gold-500/5 py-2 px-4 rounded-full border border-gold-500/10"
          >
            <ChevronRight size={14} className="rotate-180" />
            Back to Overview
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection || 'main'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderSectionContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {!activeSection && (
        <div className="text-center pt-8">
          <p className="text-[10px] text-gray-700 font-bold uppercase tracking-[0.5em]">Fugo Fuel Elite v1.0.45</p>
        </div>
      )}
    </div>
  );
}

function SettingToggle({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between p-5 bg-gray-900 border border-gold-900/5 rounded-2xl">
      <p className="text-sm font-bold text-white uppercase tracking-wider">{label}</p>
      <div className={`w-12 h-6 rounded-full transition-all p-1 ${active ? 'bg-gold-500' : 'bg-gray-800'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, sub, onClick }: { icon: React.ReactNode, label: string, sub: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-gray-900 border border-gold-900/5 p-5 rounded-3xl flex items-center justify-between group hover:border-gold-900/20 shadow-lg shadow-black/20"
    >
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-gray-800">
                {icon}
            </div>
            <div className="text-left">
                <p className="text-sm font-bold text-white group-hover:text-gold-400 transition-colors uppercase tracking-tight">{label}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{sub}</p>
            </div>
        </div>
        <ChevronRight size={18} className="text-gray-700 group-hover:text-gold-500 transition-colors" />
    </button>
  );
}
