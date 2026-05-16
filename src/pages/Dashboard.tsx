import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  Navigation, 
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  X,
  Check,
  ChevronRight,
  Wrench,
  TrendingUp,
  Clock,
  Navigation2,
  Power,
  Bell,
  HelpCircle,
  Zap,
  Gift,
  Search,
  ArrowRight,
  Wallet,
  Calendar,
  Hammer
} from 'lucide-react';
import MapView from '../components/Map';
import SlotBooking from '../components/SlotBooking';
import { 
  UserProfile, 
  Order, 
  OrderStatus, 
  UserRole, 
  UserStatus,
  SOSAlert,
  Location 
} from '../types';
import { 
  createOrder, 
  acceptOrder, 
  updateOrderStatus, 
  createSOS,
  updateProfileLocation,
  subscribeToAvailableJobs,
  subscribeToCustomerOrders,
  subscribeToMyActiveDeliveries,
  subscribeToSOS,
  subscribeToUserProfile,
  updateProfileStatus
} from '../services/store';
import { cn } from '../lib/utils';
import { 
  requestNotificationPermission, 
  triggerSOSNotification, 
  triggerNewOrderNotification 
} from '../lib/notifications';

interface DashboardProps {
  profile: UserProfile;
}

// Banners for the slider
const BANNERS = [
  { id: 1, title: 'Extra ₹75 per trip!', desc: 'Earn more during peak hours (7 PM - 11 PM)', color: 'from-orange-500 to-red-500' },
  { id: 2, title: 'Refer & Earn ₹500', desc: 'Invite your fellow technicians to the Fugo network', color: 'from-blue-600 to-cyan-500' },
  { id: 3, title: 'Insurance Covered', desc: 'Fugo now provides on-duty medical coverage', color: 'from-emerald-600 to-teal-500' },
];

export default function Dashboard({ profile }: DashboardProps) {
  const isIndia = ['Asia/Calcutta', 'Asia/Kolkata'].includes(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const currencySymbol = isIndia ? '₹' : '$';
  const priceMultiplier = isIndia ? 350 : 4.5;

  const [availableJobs, setAvailableJobs] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderForm, setOrderForm] = useState({ fuelType: 'Standard Repair', amount: 1 });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [showSlotBooking, setShowSlotBooking] = useState(false);
  const [hasBookedSlot, setHasBookedSlot] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Real-time location simulation for Driver
  useEffect(() => {
    if (profile.role === UserRole.DRIVER && profile.status === UserStatus.ONLINE) {
      const interval = setInterval(() => {
        const newLat = (profile.location?.lat || 17.3850) + (Math.random() - 0.5) * 0.001;
        const newLng = (profile.location?.lng || 78.4867) + (Math.random() - 0.5) * 0.001;
        const newLoc = { lat: newLat, lng: newLng, address: profile.location?.address || 'Hyderabad, Telangana' };
        
        updateProfileLocation(newLoc);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [profile.role, profile.status, profile.location]);

  // Banner rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    unsubs.push(subscribeToSOS(setSosAlerts));

    if (profile.role === UserRole.DRIVER) {
      unsubs.push(subscribeToAvailableJobs(setAvailableJobs));
      unsubs.push(subscribeToMyActiveDeliveries(profile.uid, setMyOrders));
    } else {
      unsubs.push(subscribeToCustomerOrders(profile.uid, setMyOrders));
    }

    return () => unsubs.forEach(u => u());
  }, [profile.uid, profile.role, isIndia]);

  const handleToggleStatus = async () => {
    const newStatus = profile.status === UserStatus.ONLINE ? UserStatus.OFFLINE : UserStatus.ONLINE;
    await updateProfileStatus(newStatus);
  };

  const handleAcceptJob = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
      setSuccessMessage("TASK ACCEPTED. STARTING TRANSIT.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error("Failed to accept job", error);
    }
  };

  const updateOrderDeliveryStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    setSuccessMessage(`STATUS: ${status.toUpperCase()}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const activeTechnicianJob = myOrders.find(o => o.driverId === profile.uid && o.status !== OrderStatus.COMPLETED);
  const activeCustomerOrders = myOrders.filter(o => o.customerId === profile.uid && o.status !== OrderStatus.COMPLETED);

  return (
    <div className="h-full bg-gray-50 flex flex-col no-scrollbar">
      {/* Top Navigation */}
      <header className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-600 rounded-xl flex items-center justify-center text-black font-display font-bold italic rotate-3 shadow-lg">F</div>
          <div>
            <h1 className="text-gray-900 font-bold text-lg leading-tight uppercase tracking-tight">HYD-NALLAGANDLA NEW</h1>
            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              <MapPin size={10} className="text-gold-500" />
              <span className="truncate max-w-[200px]">{profile.location?.address || 'Hyderabad, Telangana'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {profile.role === UserRole.DRIVER && (
            <button 
              onClick={handleToggleStatus}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all font-bold text-[10px] uppercase tracking-widest",
                profile.status === UserStatus.ONLINE 
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50" 
                  : "border-gray-200 text-gray-400 bg-gray-50"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", profile.status === UserStatus.ONLINE ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
              <span>{profile.status}</span>
            </button>
          )}
          <div className="flex items-center gap-3 text-gray-400">
            <HelpCircle size={22} />
            <div className="relative">
              <Bell size={22} />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        {profile.role === UserRole.DRIVER ? (
          /* TECHNICIAN DASHBOARD */
          <div className="space-y-8 max-w-lg mx-auto">
            {hasBookedSlot && (
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
                 <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <Clock size={24} />
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-bold text-gray-900 uppercase">05:01 PM - 07:00 PM</p>
                       <span className="bg-purple-100 text-purple-600 text-[8px] font-bold px-2 py-0.5 rounded-full">Upcoming</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Reach your node before shift start time</p>
                 </div>
              </div>
            )}

            {profile.status === UserStatus.OFFLINE ? (
              <div className="space-y-6">
                <div className="bg-emerald-600 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-20">
                    <TrendingUp size={120} />
                  </div>
                  <div className="relative z-10">
                    <h2 className="text-3xl font-display font-bold italic tracking-tighter uppercase mb-2">High Earning Shift Live!</h2>
                    <p className="text-emerald-100/70 text-sm font-medium mb-8">Repairs in Gachibowli are 2.5x more right now.</p>
                    <button 
                      onClick={() => setShowSlotBooking(true)}
                      className="bg-white text-emerald-600 font-bold px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-emerald-50 transition-all uppercase tracking-widest text-xs"
                    >
                      Book Slots & Earn <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: <Wallet className="text-gold-600" />, label: 'Earnings', val: `${currencySymbol}12,500` },
                    { icon: <Zap className="text-gold-600" />, label: 'Incentives', val: `${currencySymbol}1,250` },
                    { icon: <Calendar className="text-gold-600" />, label: 'Slots', val: hasBookedSlot ? '1 Reserved' : 'None Booked' },
                    { icon: <Gift className="text-gold-600" />, label: 'Joining Bonus', val: `${currencySymbol}1000` },
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => i === 2 && setShowSlotBooking(true)}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 text-center cursor-pointer active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 bg-gold-50 rounded-xl flex items-center justify-center">{item.icon}</div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-gray-900">{item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ONLINE TECHNICIAN VIEW */
              <div className="space-y-8">
                {activeTechnicianJob ? (
                  /* ACTIVE TASK FLOW */
                  <div className="bg-white border-4 border-gold-500 rounded-[40px] shadow-2xl overflow-hidden relative">
                    <div className="bg-gold-500 p-6 flex justify-between items-center text-black">
                      <div>
                        <h3 className="font-display font-bold text-2xl italic tracking-tighter uppercase">MISSION ACTIVE</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Technician ID: {profile.uid.slice(0, 8)}</p>
                      </div>
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                        <Navigation2 size={24} className="text-gold-500" />
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-900 shadow-sm">
                          <MapPin size={24} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Target Coordinates</p>
                          <p className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{activeTechnicianJob.location.address}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Protocol</p>
                          <p className="font-bold text-gray-900">{activeTechnicianJob.fuelType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Payload</p>
                          <p className="font-bold text-green-600">{currencySymbol}{activeTechnicianJob.price.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {activeTechnicianJob.status === OrderStatus.ACCEPTED && (
                          <button 
                            onClick={() => updateOrderDeliveryStatus(activeTechnicianJob.id, OrderStatus.DELIVERING)}
                            className="w-full bg-black text-gold-500 font-bold py-5 rounded-2xl shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                          >
                            <Zap size={18} />
                            Start Service Transit
                          </button>
                        )}
                        {activeTechnicianJob.status === OrderStatus.DELIVERING && (
                          <button 
                            onClick={() => updateOrderDeliveryStatus(activeTechnicianJob.id, OrderStatus.COMPLETED)}
                            className="w-full bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                          >
                            <Check size={18} />
                            Complete Repair Node
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* AVAILABLE JOBS / SEARCHING */
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[40px] border border-gold-500/20 shadow-xl text-center relative overflow-hidden group">
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/5 rounded-full group-hover:bg-gold-500/10 transition-colors" />
                       <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                          <div className="absolute inset-0 border-2 border-gold-500 rounded-full animate-ping opacity-30" />
                          <Wrench size={32} className="text-gold-600" />
                       </div>
                       <h3 className="text-gray-900 font-display font-bold text-2xl italic tracking-tighter uppercase mb-2">Searching for Tasks...</h3>
                       <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] max-w-xs mx-auto mb-8">Maintain your position. High-priority repair requests will materialize here.</p>
                       <div className="flex justify-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-gold-500 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-gold-500 animate-bounce delay-100" />
                          <div className="w-2 h-2 rounded-full bg-gold-500 animate-bounce delay-200" />
                       </div>
                    </div>

                    {availableJobs.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                           <h4 className="text-gray-900 font-bold uppercase tracking-widest text-[10px]">Open Protocols ({availableJobs.length})</h4>
                           <ArrowRight size={14} className="text-gray-400" />
                        </div>
                        {availableJobs.map(job => (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            key={job.id} 
                            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between"
                          >
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center text-gold-600 font-bold">
                                  {job.fuelType === 'Standard Repair' ? <Wrench /> : <Hammer />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{job.fuelType}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[150px]">{job.location.address}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-emerald-600 font-bold">{currencySymbol}{job.price.toFixed(0)}</p>
                                <button 
                                  onClick={() => handleAcceptJob(job.id)}
                                  className="text-[9px] font-bold text-white bg-black px-4 py-2 rounded-xl uppercase tracking-widest mt-2 hover:bg-gold-500 hover:text-black transition-all"
                                >
                                  Take Job
                                </button>
                             </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PROMO BANNERS */}
            <div className="relative overflow-hidden group">
               <motion.div 
                animate={{ x: `-${bannerIndex * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex"
               >
                 {BANNERS.map(banner => (
                   <div key={banner.id} className="min-w-full px-2">
                     <div className={cn("bg-gradient-to-br p-8 rounded-[40px] text-white shadow-lg relative h-48 flex flex-col justify-center", banner.color)}>
                        <h4 className="text-2xl font-display font-bold italic tracking-tighter uppercase mb-1">{banner.title}</h4>
                        <p className="text-white/70 text-sm font-medium">{banner.desc}</p>
                     </div>
                   </div>
                 ))}
               </motion.div>
               <div className="flex justify-center gap-2 mt-4">
                  {BANNERS.map((_, i) => (
                    <div key={i} className={cn("w-2 h-2 rounded-full transition-all", bannerIndex === i ? "bg-gold-500 w-6" : "bg-gray-200")} />
                  ))}
               </div>
            </div>
          </div>
        ) : (
          /* CUSTOMER DASHBOARD */
          <div className="space-y-8 max-w-lg mx-auto">
            {/* SEARCH / CATEGORY */}
            <div className="space-y-6">
               <div className="relative">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                  type="search" 
                  placeholder="Search for repair services..."
                  className="w-full bg-white border border-gray-100 rounded-3xl py-6 px-16 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gold-500/5 shadow-sm"
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-gold-500 p-3 rounded-2xl text-black">
                   <Zap size={20} />
                 </div>
               </div>

               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                 {['All', 'Repair', 'Maintenance', 'Emergency', 'Inspection'].map(cat => (
                   <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap",
                      selectedCategory === cat ? "bg-black text-gold-500 shadow-xl" : "bg-white text-gray-400 border border-gray-100"
                    )}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>

            {/* ACTIVE ORDER CARDS FOR CUSTOMER */}
            {activeCustomerOrders.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-gray-900 font-bold uppercase tracking-widest text-[10px] px-2">Active Protocols</h4>
                {activeCustomerOrders.map(order => (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={order.id} 
                    className="bg-white border-2 border-gold-500 rounded-[30px] p-6 shadow-xl relative overflow-hidden"
                  >
                     <div className="flex justify-between items-center mb-6">
                        <div>
                          <p className="text-[10px] text-gold-600 font-bold uppercase tracking-[0.2em] mb-1">Order {order.status}</p>
                          <h4 className="text-xl font-display font-bold italic tracking-tighter uppercase">{order.fuelType}</h4>
                        </div>
                        <div className="bg-gold-50 p-2.5 rounded-2xl">
                          <Clock className="text-gold-600" />
                        </div>
                     </div>
                     <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-6">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: order.status === OrderStatus.ACCEPTED ? '30%' : '60%' }}
                          className="h-full bg-gold-500"
                        />
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <p>{order.location.address.slice(0, 20)}...</p>
                        <p>{currencySymbol}{order.price.toFixed(2)}</p>
                     </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* MAIN ACTION BANNERS */}
            <div className="grid grid-cols-2 gap-4">
               <div 
                onClick={() => setIsOrdering(true)}
                className="bg-gold-500 p-8 rounded-[40px] text-black shadow-xl cursor-pointer hover:scale-[0.98] transition-all relative overflow-hidden group"
               >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full group-hover:scale-110 transition-transform" />
                  <Wrench size={40} className="mb-6" />
                  <h3 className="text-2xl font-display font-bold italic tracking-tighter uppercase leading-tight">Request Repair</h3>
               </div>
               <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldAlert size={60} />
                  </div>
                  <Plus className="text-gray-300 mb-6" size={40} />
                  <h3 className="text-2xl font-display font-bold italic tracking-tighter uppercase leading-tight text-gray-400">Add Service</h3>
               </div>
            </div>

            {/* RECENT / FEATURED SECTION */}
            <section className="space-y-6">
               <div className="flex items-center justify-between px-2">
                 <h4 className="text-gray-900 font-bold uppercase tracking-widest text-[10px]">Top Service Nodes</h4>
                 <ArrowRight size={14} className="text-gray-400" />
               </div>
               <div className="bg-white rounded-[40px] p-6 space-y-6 border border-gray-100 shadow-sm">
                 {[
                   { name: 'Central Gachibowli Node', rating: '4.9', time: '12 min', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=100&h=100&fit=crop' },
                   { name: 'Financial Dist. Mobile Node', rating: '4.7', time: '18 min', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=100&h=100&fit=crop' },
                 ].map((node, i) => (
                   <div key={i} className="flex gap-4 items-center group cursor-pointer">
                      <img src={node.img} alt={node.name} className="w-16 h-16 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all shadow-sm" />
                      <div className="flex-1">
                        <h5 className="font-bold text-gray-900 leading-tight">{node.name}</h5>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                          <span className="flex items-center gap-1 text-gold-600"><Zap size={10} fill="currentColor" /> {node.rating}</span>
                          <span>{node.time}</span>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-200" />
                   </div>
                 ))}
               </div>
            </section>
          </div>
        )}
      </main>

      {/* Floating Success Indicator (Swiggy Style Snack) */}
      <AnimatePresence>
        {successMessage && (
          <div className="fixed bottom-32 left-0 right-0 flex justify-center z-[200] px-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-black text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
            >
              <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center text-black">
                <Check size={14} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{successMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {isOrdering && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrdering(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[50px] p-10 z-[201] shadow-2xl space-y-10"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-display font-bold italic tracking-tighter uppercase text-gray-900">Establish Repair Node</h2>
                <button onClick={() => setIsOrdering(false)} className="bg-gray-100 p-3 rounded-full text-gray-900">
                  <X />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Protocol Category</label>
                   <div className="grid grid-cols-2 gap-4">
                     {['Standard Repair', 'Maintenance', 'Emergency Fix', 'Inspection'].map(cat => (
                       <button 
                        key={cat}
                        onClick={() => setOrderForm(prev => ({ ...prev, fuelType: cat }))}
                        className={cn(
                          "py-4 rounded-2xl border-2 transition-all font-bold text-sm uppercase px-4 text-left",
                          orderForm.fuelType === cat ? "border-gold-500 bg-gold-50 text-gold-600" : "border-gray-100 text-gray-400"
                        )}
                       >
                         {cat}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="bg-gray-50 p-8 rounded-[40px] flex items-center justify-between border border-gray-100">
                   <div>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Estimated Cost</p>
                     <p className="text-4xl font-display font-bold italic tracking-tighter text-gray-900">{currencySymbol}{(orderForm.amount * priceMultiplier).toFixed(0)}</p>
                   </div>
                   <button 
                    onClick={async () => {
                      const orderId = await createOrder({
                        fuelType: orderForm.fuelType,
                        amount: orderForm.amount,
                        location: profile.location || { lat: 17.3850, lng: 78.4867, address: "Hyderabad, Telangana" },
                        price: orderForm.amount * priceMultiplier
                      });
                      if (orderId) {
                        setIsOrdering(false);
                        setSuccessMessage("REPAIR NODE ESTABLISHED");
                        setTimeout(() => setSuccessMessage(null), 3000);
                      }
                    }}
                    className="bg-gold-500 text-black font-bold px-10 py-5 rounded-3xl shadow-xl shadow-gold-500/20 uppercase tracking-widest text-sm"
                   >
                     Submit Node
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSlotBooking && (
          <div className="fixed inset-0 z-[300]">
            <SlotBooking 
              onClose={() => setShowSlotBooking(false)}
              onBooked={() => {
                setShowSlotBooking(false);
                setHasBookedSlot(true);
                setSuccessMessage("SHIFT RESERVED");
                setTimeout(() => setSuccessMessage(null), 3000);
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
