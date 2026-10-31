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
  Hammer,
  Volume2,
  Radio,
  LocateFixed,
  KeyRound,
  Database,
  Truck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Settings2
} from 'lucide-react';
import MapView from '../components/Map';
import SlotBooking from '../components/SlotBooking';
import OtpVerificationModal from '../components/OtpVerificationModal';
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
  acceptJob,
  completeOrderWithOtp,
  sendLocationPing,
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
import {
  testSupabaseConnection,
  insertSupabaseOrder,
  getEffectiveSupabaseConfig,
  resetSupabaseClient,
  DEFAULT_SUPABASE_PROJECT_ID,
  DEFAULT_SUPABASE_URL
} from '../lib/supabase';
import { cn } from '../lib/utils';
import { 
  requestNotificationPermission, 
  triggerSOSNotification, 
  triggerNewOrderNotification 
} from '../lib/notifications';
import IncomingJobDialog from '../components/IncomingJobDialog';
import { ringtoneManager } from '../lib/ringtone';

interface DashboardProps {
  profile: UserProfile;
}

// Banners for the slider
const BANNERS = [
  { id: 1, title: 'Extra ₹75 per trip!', desc: 'Earn more during peak hours (7 PM - 11 PM)', color: 'from-orange-500 to-red-500' },
  { id: 2, title: 'Hyderabad Fuel Hubs', desc: 'Reserve high-demand slots in Gachibowli & Nallagandla', color: 'from-purple-600 to-indigo-500' },
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

  // Real-time Incoming Job & Ringtone State
  const [activeIncomingJob, setActiveIncomingJob] = useState<Order | null>(null);
  const [declinedJobIds, setDeclinedJobIds] = useState<Set<string>>(new Set());

  // Supabase Connection & OTP Verification State
  const [supabaseInfo, setSupabaseInfo] = useState<{
    checked: boolean;
    connected: boolean;
    message: string;
    projectId?: string;
    activeUrl?: string;
    isFromEnv?: boolean;
    source?: string;
  }>(() => {
    const cfg = getEffectiveSupabaseConfig();
    return {
      checked: false,
      connected: false,
      message: 'Initializing Supabase connection...',
      projectId: cfg.projectId,
      activeUrl: cfg.url,
      isFromEnv: cfg.isFromEnv,
      source: cfg.source
    };
  });
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrl, setCustomUrl] = useState(() => getEffectiveSupabaseConfig().url);
  const [customKey, setCustomKey] = useState(() => getEffectiveSupabaseConfig().key);
  const [isPushingSupabaseOrder, setIsPushingSupabaseOrder] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [orderForOtp, setOrderForOtp] = useState<Order | null>(null);

  const declinedJobIdsRef = useRef(declinedJobIds);
  declinedJobIdsRef.current = declinedJobIds;
  const activeIncomingJobRef = useRef(activeIncomingJob);
  activeIncomingJobRef.current = activeIncomingJob;
  const myOrdersRef = useRef(myOrders);
  myOrdersRef.current = myOrders;

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const res = await testSupabaseConnection();
      setSupabaseInfo({
        checked: true,
        connected: res.connected,
        message: res.message,
        projectId: res.projectId,
        activeUrl: res.activeUrl,
        isFromEnv: res.isFromEnv,
        source: res.source
      });
    } catch (err: any) {
      setSupabaseInfo(prev => ({
        ...prev,
        checked: true,
        connected: false,
        message: err?.message || 'Connection error'
      }));
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleApplyCustomConfig = (urlToSet?: string, keyToSet?: string) => {
    resetSupabaseClient(urlToSet, keyToSet);
    handleCheckConnection();
    setShowConfigModal(false);
  };

  const handleResetToEnvConfig = () => {
    resetSupabaseClient('', '');
    const cfg = getEffectiveSupabaseConfig();
    setCustomUrl(cfg.url);
    setCustomKey(cfg.key);
    handleCheckConnection();
    setShowConfigModal(false);
  };

  // Supabase connection check on load
  useEffect(() => {
    handleCheckConnection();
  }, []);

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

  // Real-time Orders & Stream Listener
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    unsubs.push(subscribeToSOS(setSosAlerts));

    if (profile.role === UserRole.DRIVER) {
      // Connects directly to Supabase stream:
      // Supabase.instance.client.from('orders').stream().eq('status', 'PENDING')
      unsubs.push(subscribeToAvailableJobs((orders) => {
        setAvailableJobs(orders);

        // When orders stream in with status 'PENDING', trigger ringtone & show "New Job Available" dialog
        if (profile.status === UserStatus.ONLINE) {
          const hasOngoingTask = myOrdersRef.current.some(
            o => o.driverId === profile.uid && o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED
          );

          if (!hasOngoingTask && !activeIncomingJobRef.current) {
            const pendingJob = orders.find(
              o => o.status === OrderStatus.PENDING && !declinedJobIdsRef.current.has(o.id)
            );
            if (pendingJob) {
              setActiveIncomingJob(pendingJob);
              triggerNewOrderNotification();
            }
          }
        }
      }));

      unsubs.push(subscribeToMyActiveDeliveries(profile.uid, (orders) => {
        setMyOrders(orders);
        const hasOngoingTask = orders.some(
          o => (o.driverId === profile.uid || o.driver_id === profile.uid) && 
               o.status !== OrderStatus.COMPLETED && 
               o.status !== OrderStatus.CANCELLED
        );
        if (hasOngoingTask && activeIncomingJobRef.current) {
          ringtoneManager.stopRinging();
          setActiveIncomingJob(null);
        }
      }));
    } else {
      unsubs.push(subscribeToCustomerOrders(profile.uid, setMyOrders));
    }

    return () => {
      unsubs.forEach(u => u());
      ringtoneManager.stopRinging();
    };
  }, [profile.uid, profile.role, profile.status, isIndia]);

  // When driver toggles status
  const handleToggleStatus = async () => {
    const newStatus = profile.status === UserStatus.ONLINE ? UserStatus.OFFLINE : UserStatus.ONLINE;
    if (newStatus === UserStatus.OFFLINE) {
      ringtoneManager.stopRinging();
      setActiveIncomingJob(null);
    }
    await updateProfileStatus(newStatus);
  };

  /**
   * Display incoming dispatch requests with an 'Accept' button.
   * When accepted, update the order status to 'IN_TRANSIT'.
   */
  const handleAcceptJob = async (orderId: string) => {
    try {
      ringtoneManager.stopRinging();
      const currentActive = activeIncomingJobRef.current;
      setActiveIncomingJob(null);

      // Optimistically record job assignment for instant UI responsiveness
      if (currentActive && currentActive.id === orderId) {
        const inTransitJob: Order = {
          ...currentActive,
          driverId: profile.uid,
          driver_id: profile.uid,
          status: OrderStatus.IN_TRANSIT,
          updatedAt: new Date().toISOString()
        };
        setMyOrders(prev => [inTransitJob, ...prev.filter(p => p.id !== orderId)]);
      }

      // Supabase database update: driver_id & status: 'IN_TRANSIT'
      await acceptJob(orderId, profile.uid);
      setSuccessMessage("DISPATCH ACCEPTED: STATUS UPDATED TO 'IN_TRANSIT'");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error("Failed to accept job", error);
    }
  };

  const handleDeclineIncomingJob = (orderId: string) => {
    ringtoneManager.stopRinging();
    setDeclinedJobIds(prev => new Set(prev).add(orderId));
    setActiveIncomingJob(null);
  };

  // Push a live test order into Supabase
  const handlePushTestSupabaseOrder = async () => {
    setIsPushingSupabaseOrder(true);
    try {
      const hyderabadFuelDispatches = [
        { type: 'Diesel (Commercial Generator)', amt: 35, price: 3325, addr: 'DLF Cybercity, Gachibowli, Hyderabad' },
        { type: 'High Speed Diesel (Fleet)', amt: 50, price: 4750, addr: 'WaveRock SEZ, Financial District, Hyderabad' },
        { type: 'Petrol (Speed 95)', amt: 25, price: 2650, addr: 'Raheja Mindspace, Madhapur, Hyderabad' },
        { type: 'Diesel (High Density)', amt: 40, price: 3800, addr: 'Aparna Sarovar, Nallagandla, Hyderabad' },
      ];
      const pick = hyderabadFuelDispatches[Math.floor(Math.random() * hyderabadFuelDispatches.length)];
      
      const res = await insertSupabaseOrder({
        fuelType: pick.type,
        amount: pick.amt,
        price: pick.price,
        location: {
          lat: (profile.location?.lat || 17.4400) + (Math.random() - 0.5) * 0.008,
          lng: (profile.location?.lng || 78.3489) + (Math.random() - 0.5) * 0.008,
          address: pick.addr
        }
      });

      if (res.order) {
        setSuccessMessage("NEW DISPATCH PUSHED TO SUPABASE (status: PENDING)");
        setTimeout(() => setSuccessMessage(null), 4000);
        // If driver is online, trigger incoming dialog
        if (profile.status === UserStatus.ONLINE && !activeIncomingJob) {
          setActiveIncomingJob(res.order);
          triggerNewOrderNotification();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPushingSupabaseOrder(false);
    }
  };

  const handleSimulateIncomingJob = () => {
    // If a candidate exists in availableJobs, trigger it
    const candidate = availableJobs.find(j => (j.status === OrderStatus.PENDING || j.status === 'PENDING' || j.status === 'pending') && !declinedJobIds.has(j.id));
    if (candidate) {
      setActiveIncomingJob(candidate);
      triggerNewOrderNotification();
      return;
    }

    // Realistic simulated fuel dispatch with ringtone
    const mockOrder: Order = {
      id: `ord_supa_${Date.now().toString().slice(-4)}`,
      customerId: 'cust_cyberabad',
      status: OrderStatus.PENDING,
      fuelType: 'Emergency Diesel Handover (50L)',
      amount: 50,
      location: {
        lat: (profile.location?.lat || 17.4400) + 0.005,
        lng: (profile.location?.lng || 78.3489) + 0.004,
        address: 'Cyber Towers Main Gate, HITEC City, Hyderabad'
      },
      price: isIndia ? 4750 : 65.00,
      otp: '4821',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setActiveIncomingJob(mockOrder);
    triggerNewOrderNotification();
  };

  const handleOpenOtpModal = (order: Order) => {
    setOrderForOtp(order);
    setShowOtpModal(true);
  };

  const handleVerifyAndCompleteOtp = async (enteredOtp: string) => {
    if (!orderForOtp) return { success: false, error: 'No active order selected' };
    const res = await completeOrderWithOtp(orderForOtp.id, enteredOtp, orderForOtp.otp || orderForOtp.delivery_otp);
    if (res.success) {
      setSuccessMessage("OTP VERIFIED! ORDER MARKED 'COMPLETED' IN SUPABASE");
      setTimeout(() => setSuccessMessage(null), 4000);
    }
    return res;
  };

  const updateOrderDeliveryStatus = async (orderId: string, status: OrderStatus | string) => {
    await updateOrderStatus(orderId, status);
    setSuccessMessage(`STATUS: ${status.toString().toUpperCase()}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const [lastPing, setLastPing] = useState<{ lat: number; lng: number; time: string } | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const activeTechnicianJob = myOrders.find(
    o => (o.driverId === profile.uid || o.driver_id === profile.uid) && 
         o.status !== OrderStatus.COMPLETED && 
         o.status !== 'completed' &&
         o.status !== OrderStatus.CANCELLED &&
         o.status !== 'cancelled'
  );
  const activeCustomerOrders = myOrders.filter(
    o => o.customerId === profile.uid && 
         o.status !== OrderStatus.COMPLETED &&
         o.status !== 'completed'
  );

  // Direct integration of:
  // void sendLocationPing(String orderId, double lat, double lng)
  const handleSendLocationPing = async (orderId: string, customLat?: number, customLng?: number) => {
    try {
      setIsPinging(true);
      const pingLat = customLat ?? ((profile.location?.lat || 17.3850) + (Math.random() - 0.5) * 0.0006);
      const pingLng = customLng ?? ((profile.location?.lng || 78.4867) + (Math.random() - 0.5) * 0.0006);
      await sendLocationPing(orderId, pingLat, pingLng);
      setLastPing({
        lat: pingLat,
        lng: pingLng,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      setTimeout(() => setIsPinging(false), 600);
    } catch (err) {
      console.error("Failed to send location ping", err);
      setIsPinging(false);
    }
  };

  // Periodic driver GPS pinging to Firestore/Supabase orders table while mission is active
  useEffect(() => {
    if (profile.role !== UserRole.DRIVER || !activeTechnicianJob) return;

    // Send immediate ping upon assignment / active task load
    handleSendLocationPing(activeTechnicianJob.id);

    // Keep broadcasting live coordinates every 5 seconds
    const interval = setInterval(() => {
      handleSendLocationPing(activeTechnicianJob.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [profile.role, activeTechnicianJob?.id]);

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

                      {/* Live GPS Ping Telemetry Panel */}
                      <div className="bg-gradient-to-br from-neutral-900 to-black text-white p-5 rounded-3xl border border-gold-500/30 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-3 h-3 rounded-full flex items-center justify-center transition-all",
                              isPinging ? "bg-emerald-400 animate-ping" : "bg-emerald-500"
                            )}>
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </span>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
                              Live GPS Ping Stream
                            </span>
                          </div>
                          <button
                            onClick={() => handleSendLocationPing(activeTechnicianJob.id)}
                            disabled={isPinging}
                            className="text-[9px] font-bold uppercase tracking-wider bg-gold-500 hover:bg-gold-400 text-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                          >
                            <LocateFixed size={12} className={cn(isPinging && "animate-spin")} />
                            <span>{isPinging ? "Pinging..." : "Ping Now"}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/5 p-3 rounded-2xl border border-white/10">
                          <div>
                            <span className="text-gray-400 text-[9px] block uppercase font-sans font-bold">driver_lat</span>
                            <span className="text-gold-400 font-bold">
                              {lastPing?.lat ? lastPing.lat.toFixed(5) : (activeTechnicianJob.driver_lat?.toFixed(5) || (profile.location?.lat || 17.3850).toFixed(5))}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[9px] block uppercase font-sans font-bold">driver_lng</span>
                            <span className="text-gold-400 font-bold">
                              {lastPing?.lng ? lastPing.lng.toFixed(5) : (activeTechnicianJob.driver_lng?.toFixed(5) || (profile.location?.lng || 78.4867).toFixed(5))}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Radio size={10} className="text-emerald-400 animate-pulse" />
                            <span>Broadcasting coords every 5s</span>
                          </span>
                          <span>Last ping: {lastPing?.time || 'Broadcasting...'}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Live Status indicator */}
                        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                              Status: {activeTechnicianJob.status}
                            </span>
                          </div>
                          <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                            Supabase Synced
                          </span>
                        </div>

                        {/* Primary Completion Button with OTP verification */}
                        <button 
                          onClick={() => handleOpenOtpModal(activeTechnicianJob)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                          <KeyRound size={20} />
                          <span>Verify Delivery OTP & Mark Completed</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* AVAILABLE JOBS / SEARCHING */
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[40px] border border-gold-500/20 shadow-xl text-center relative overflow-hidden group">
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/5 rounded-full group-hover:bg-gold-500/10 transition-colors" />
                       
                       {/* Supabase Realtime Subscription Indicator & Controls */}
                       <div className="inline-flex flex-col items-center gap-2 px-5 py-3 bg-neutral-900 text-white rounded-2xl text-[10px] uppercase tracking-wider mb-5 border border-gold-500/30 shadow-lg max-w-md mx-auto w-full">
                         <div className="flex items-center justify-between w-full border-b border-white/10 pb-2">
                           <div className="flex items-center gap-2">
                             <div className={`w-2.5 h-2.5 rounded-full ${supabaseInfo.connected ? 'bg-emerald-400 animate-ping' : isCheckingConnection ? 'bg-amber-400 animate-spin' : 'bg-red-400'}`} />
                             <Database size={14} className="text-gold-400" />
                             <span className="text-gold-400 font-mono font-bold">
                               {supabaseInfo.projectId || DEFAULT_SUPABASE_PROJECT_ID}
                             </span>
                           </div>

                           <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                               supabaseInfo.isFromEnv 
                                 ? 'bg-blue-900/60 text-blue-300 border border-blue-500/40' 
                                 : 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                             }`}>
                               {supabaseInfo.isFromEnv ? 'ENV VARS' : 'CONFIGURED'}
                             </span>

                             <button
                               onClick={handleCheckConnection}
                               disabled={isCheckingConnection}
                               title="Re-test / Reload Supabase Connection"
                               className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                             >
                               <RefreshCw size={13} className={isCheckingConnection ? 'animate-spin text-gold-400' : ''} />
                             </button>

                             <button
                               onClick={() => setShowConfigModal(true)}
                               title="Supabase Connection Settings"
                               className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-gold-400 transition-colors"
                             >
                               <Settings2 size={13} />
                             </button>
                           </div>
                         </div>

                         <div className="flex items-center justify-between w-full text-[9px] text-gray-300 pt-0.5">
                           <span className="flex items-center gap-1">
                             Status: <strong className={supabaseInfo.connected ? 'text-emerald-400' : 'text-amber-400'}>
                               {supabaseInfo.connected ? 'Connected' : isCheckingConnection ? 'Checking...' : 'Connecting'}
                             </strong>
                           </span>
                           <span className="text-gray-400 truncate max-w-[200px]" title={supabaseInfo.message}>
                             {supabaseInfo.message}
                           </span>
                         </div>

                         <div className="w-full text-[9px] text-gray-400 font-mono text-left bg-black/40 px-2.5 py-1 rounded border border-white/5 flex items-center justify-between">
                           <span>stream: orders (status = 'PENDING')</span>
                           <span className="text-emerald-400 font-bold">● Active</span>
                         </div>
                       </div>

                       <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                          <div className="absolute inset-0 border-2 border-gold-500 rounded-full animate-ping opacity-30" />
                          <Wrench size={32} className="text-gold-600" />
                       </div>
                       
                       <h3 className="text-gray-900 font-display font-bold text-2xl italic tracking-tighter uppercase mb-2">
                         Incoming Dispatch Radar
                       </h3>
                       <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.15em] max-w-xs mx-auto mb-6">
                         Real-time channel active. Incoming fuel delivery dispatches stream automatically with audible ringtone.
                       </p>
                       
                       <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                         <button
                           onClick={handleSimulateIncomingJob}
                           className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-black hover:bg-gold-500 text-gold-400 hover:text-black rounded-2xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md"
                         >
                           <Volume2 size={16} className="animate-pulse" />
                           <span>Simulate Dispatch (Ringtone + Dialog)</span>
                         </button>

                         <button
                           onClick={handlePushTestSupabaseOrder}
                           disabled={isPushingSupabaseOrder}
                           className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md disabled:opacity-50"
                         >
                           <Sparkles size={16} />
                           <span>{isPushingSupabaseOrder ? 'Pushing to Supabase...' : 'Push Order to Supabase'}</span>
                         </button>
                       </div>

                       <div className="flex justify-center gap-4 mt-6">
                          <div className="w-2 h-2 rounded-full bg-gold-500 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-gold-500 animate-bounce delay-100" />
                          <div className="w-2 h-2 rounded-full bg-gold-500 animate-bounce delay-200" />
                       </div>
                    </div>

                    {availableJobs.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                           <h4 className="text-gray-900 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             Incoming Dispatch Requests ({availableJobs.length})
                           </h4>
                           <span className="text-[10px] text-gray-400 font-mono">status = PENDING</span>
                        </div>
                        {availableJobs.map(job => (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            key={job.id} 
                            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between gap-4"
                          >
                             <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center text-gold-600 font-bold shrink-0">
                                  <Truck size={22} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter truncate">
                                      {job.fuelType || job.fuel_type || 'Fuel Delivery'}
                                    </p>
                                    <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      PENDING
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[160px]">
                                    {job.location.address}
                                  </p>
                                </div>
                             </div>
                             <div className="text-right shrink-0 space-y-1.5">
                                <p className="text-emerald-600 font-extrabold text-sm font-display">
                                  {currencySymbol}{job.price.toFixed(0)}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => {
                                      setActiveIncomingJob(job);
                                      triggerNewOrderNotification();
                                    }}
                                    className="text-[9px] font-bold text-gold-700 bg-gold-100 hover:bg-gold-200 px-3 py-2 rounded-xl uppercase tracking-wider transition-all"
                                    title="View incoming job popup with ringtone"
                                  >
                                    Alert
                                  </button>
                                  <button 
                                    onClick={() => handleAcceptJob(job.id)}
                                    className="text-[9px] font-extrabold text-white bg-black hover:bg-gold-500 hover:text-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all flex items-center gap-1 shadow-sm active:scale-95"
                                  >
                                    <Zap size={12} className="fill-current" />
                                    <span>Accept</span>
                                  </button>
                                </div>
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

                     {/* Live Driver GPS Location Ping */}
                     {(order.driver_lat || order.driver_lng) && (
                       <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-200/70 px-3.5 py-2 rounded-2xl text-[10px] font-semibold text-emerald-800">
                         <div className="flex items-center gap-1.5">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                           <span className="font-bold uppercase tracking-wider">Driver GPS:</span>
                         </div>
                         <span className="font-mono text-emerald-950 font-bold">
                           {order.driver_lat?.toFixed(4)}, {order.driver_lng?.toFixed(4)}
                         </span>
                       </div>
                     )}
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

      {/* Real-time Incoming Job Alert with Dispatch Ringtone */}
      <IncomingJobDialog 
        order={activeIncomingJob}
        onAccept={handleAcceptJob}
        onDecline={handleDeclineIncomingJob}
        currencySymbol={currencySymbol}
        timeoutSeconds={30}
      />

      {/* Delivery Handover OTP Verification to mark order COMPLETED in Supabase */}
      <OtpVerificationModal 
        isOpen={showOtpModal}
        order={orderForOtp}
        onClose={() => {
          setShowOtpModal(false);
          setOrderForOtp(null);
        }}
        onVerifyAndComplete={handleVerifyAndCompleteOtp}
        currencySymbol={currencySymbol}
      />

      {/* Supabase Connection Diagnostics & Configuration Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-neutral-900 border border-gold-500/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gold-500/10 rounded-xl text-gold-400 border border-gold-500/30">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white tracking-wide">
                      Supabase Connection
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      Real-time postgres_changes stream & database
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Status Box */}
              <div className={`p-3.5 rounded-2xl mb-4 border ${
                supabaseInfo.connected 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${supabaseInfo.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span>{supabaseInfo.connected ? 'Live Connection Active' : 'Connection Status'}</span>
                </div>
                <p className="text-xs font-mono text-gray-300 break-words">
                  {supabaseInfo.message}
                </p>
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>Source: <strong className="text-white">{supabaseInfo.source === 'env' ? 'Environment Variables' : supabaseInfo.source === 'localStorage' ? 'Local Override' : 'Config Default'}</strong></span>
                  <span>Project ID: <strong className="text-gold-400">{supabaseInfo.projectId}</strong></span>
                </div>
              </div>

              {/* Configuration Inputs */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-1">
                    Supabase Project URL / ID
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://arierwpjaksxxnmvbqwn.supabase.co"
                    className="w-full bg-black/60 border border-white/20 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs outline-none transition-colors"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Supported: full URL (<code className="text-gray-400 font-mono">https://arierwpjaksxxnmvbqwn.supabase.co</code>) or project ID (<code className="text-gray-400 font-mono">arierwpjaksxxnmvbqwn</code>)
                  </span>
                </div>

                <div>
                  <label className="block text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-1">
                    Supabase Anon Key
                  </label>
                  <input
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="ap-southeast-1 or eyJhbGci..."
                    className="w-full bg-black/60 border border-white/20 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApplyCustomConfig(customUrl, customKey)}
                    className="flex-1 bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    Save & Reconnect
                  </button>
                  <button
                    onClick={handleResetToEnvConfig}
                    title="Reload from Environment Variables (.env / system)"
                    className="px-4 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Reset to Env
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCheckConnection}
                    disabled={isCheckingConnection}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-all"
                  >
                    <RefreshCw size={13} className={isCheckingConnection ? 'animate-spin text-gold-400' : ''} />
                    <span>{isCheckingConnection ? 'Testing Connection...' : 'Test Connection Now'}</span>
                  </button>
                  <button
                    onClick={() => {
                      handlePushTestSupabaseOrder();
                      setShowConfigModal(false);
                    }}
                    disabled={isPushingSupabaseOrder}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <Sparkles size={13} />
                    <span>Push Test Order</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
