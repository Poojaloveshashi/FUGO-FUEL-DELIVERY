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
  Fuel,
  TrendingUp,
  Clock,
  Navigation2,
  Power,
  Bell
} from 'lucide-react';
import MapView from '../components/Map';
import { 
  UserProfile, 
  Order, 
  OrderStatus, 
  UserRole, 
  UserStatus,
  SOSAlert 
} from '../types';
import { 
  createOrder, 
  acceptOrder, 
  updateOrderStatus, 
  createSOS,
  subscribeToAvailableJobs,
  subscribeToCustomerOrders,
  subscribeToMyActiveDeliveries,
  subscribeToSOS,
  subscribeToUserProfile
} from '../services/store';
import { cn, calculateETA } from '../lib/utils';
import { 
  requestNotificationPermission, 
  triggerSOSNotification, 
  triggerNewOrderNotification 
} from '../lib/notifications';

interface DashboardProps {
  profile: UserProfile;
}

interface OrderETADisplayProps {
  order: Order;
  currencySymbol: string;
  key?: React.Key | string;
}

function OrderETADisplay({ order, currencySymbol }: OrderETADisplayProps) {
  const [driverProfile, setDriverProfile] = useState<UserProfile | null>(null);
  const [mockETA, setMockETA] = useState(12);

  useEffect(() => {
    if (!order.driverId) return;
    if (order.driverId === 'guest-id') {
      const interval = setInterval(() => {
        setMockETA(prev => Math.max(1, prev - 1));
      }, 30000); // Decrease mock ETA every 30s
      return () => clearInterval(interval);
    }
    return subscribeToUserProfile(order.driverId, setDriverProfile);
  }, [order.driverId]);

  const eta = driverProfile?.location && order.location
    ? calculateETA(
        driverProfile.location.lat, 
        driverProfile.location.lng, 
        order.location.lat, 
        order.location.lng
      )
    : mockETA;

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gray-900 border border-gold-400 px-4 py-4 rounded-2xl shadow-2xl pointer-events-auto flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center">
          <Fuel className="text-black" />
        </div>
        <div>
          <p className="text-gold-400 font-bold text-sm uppercase italic tracking-tighter">ORDER {order.status}</p>
          <p className="text-gray-400 text-[12px] font-mono">{order.fuelType} - {currencySymbol}{order.price.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-ping" />
            <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">ETA {eta} MINS</span>
          </div>
          {driverProfile?.displayName && (
            <span className="text-[8px] text-gold-500/50 uppercase font-bold mt-1">Unit: {driverProfile.displayName}</span>
          )}
      </div>
    </motion.div>
  );
}

export default function Dashboard({ profile }: DashboardProps) {
  const isIndia = ['Asia/Calcutta', 'Asia/Kolkata'].includes(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const currencySymbol = isIndia ? '₹' : '$';
  const priceMultiplier = isIndia ? 350 : 4.5;

  const [availableJobs, setAvailableJobs] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderForm, setOrderForm] = useState({ fuelType: 'Premium Gasoline', amount: 50 });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  const prevSosCount = useRef(sosAlerts.length);
  const prevJobsCount = useRef(availableJobs.length);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Detect new SOS alerts
    if (sosAlerts.length > prevSosCount.current) {
        const lastSOS = sosAlerts[sosAlerts.length - 1];
        if (profile.role !== UserRole.CUSTOMER) {
          triggerSOSNotification(profile.role, lastSOS.location.address || 'Unknown Sector');
        }
    }
    prevSosCount.current = sosAlerts.length;
  }, [sosAlerts.length, profile.role]);

  useEffect(() => {
    // Detect new jobs for drivers
    if (profile.role === UserRole.DRIVER && availableJobs.length > prevJobsCount.current) {
        triggerNewOrderNotification();
    }
    prevJobsCount.current = availableJobs.length;
  }, [availableJobs.length, profile.role]);

  useEffect(() => {
    if (profile.uid === 'guest-id') {
      const isIndia = ['Asia/Calcutta', 'Asia/Kolkata'].includes(Intl.DateTimeFormat().resolvedOptions().timeZone);
      // Setup mock data for guest
      const mockOrders: Order[] = [
        {
          id: 'mock-1',
          customerId: 'guest-id',
          driverId: 'guest-id',
          fuelType: 'Premium Gasoline',
          amount: 25,
          location: { lat: 37.424, lng: -122.086, address: "Stanford University" },
          status: OrderStatus.ACCEPTED,
          price: isIndia ? 8750 : 112.50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'mock-2',
          customerId: 'customer-alpha',
          driverId: null,
          fuelType: 'Diesel Elite',
          amount: 15,
          location: { lat: 37.428, lng: -122.09, address: "Googleplex, Mountain View" },
          status: OrderStatus.PENDING,
          price: isIndia ? 5250 : 67.50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const mockSOS: SOSAlert[] = [
        {
          id: 'sos-1',
          userId: 'user-beta',
          location: { lat: 37.42, lng: -122.08, address: "Highway 101" },
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];

      setAvailableJobs(mockOrders.filter(o => o.status === OrderStatus.PENDING));
      setMyOrders(mockOrders.filter(o => o.customerId === 'guest-id' || o.driverId === 'guest-id' || o.id === 'mock-1'));
      setSosAlerts(mockSOS);
      return;
    }

    let unsubs: (() => void)[] = [];
    
    unsubs.push(subscribeToSOS(setSosAlerts));

    if (profile.role === UserRole.DRIVER) {
      unsubs.push(subscribeToAvailableJobs(setAvailableJobs));
      unsubs.push(subscribeToMyActiveDeliveries(profile.uid, setMyOrders));
    } else {
      unsubs.push(subscribeToCustomerOrders(profile.uid, setMyOrders));
    }

    return () => unsubs.forEach(u => u());
  }, [profile.uid, profile.role]);

  const handleAcceptJob = async (orderId: string) => {
    try {
      if (profile.uid === 'guest-id') {
        const job = availableJobs.find(j => j.id === orderId);
        if (job) {
          const acceptedJob = { ...job, status: OrderStatus.ACCEPTED, driverId: profile.uid };
          setAvailableJobs(prev => prev.filter(j => j.id !== orderId));
          setMyOrders(prev => [...prev, acceptedJob]);
          setSuccessMessage("MISSION ENGAGED. EN ROUTE.");
          setTimeout(() => setSuccessMessage(null), 4000);
        }
        return;
      }
      
      await acceptOrder(orderId);
      setSuccessMessage("MISSION ENGAGED. GPS SYNCING.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error("Failed to accept job", error);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (profile.uid === 'guest-id') {
      setMyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.COMPLETED } : o));
      setSuccessMessage("MISSION ACCOMPLISHED. CREDIT SECURED.");
      setTimeout(() => setSuccessMessage(null), 4000);
      return;
    }
    await updateOrderStatus(orderId, OrderStatus.COMPLETED);
    setSuccessMessage("MISSION ACCOMPLISHED. CREDIT SECURED.");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCreateOrder = async () => {
    // Mocking current location for now
    const location = { lat: 37.42, lng: -122.08, address: "Tech Square, Palo Alto" };
    const price = orderForm.amount * priceMultiplier;
    
    try {
      if (profile.uid === 'guest-id') {
        const newOrder: Order = {
          id: `mock-${Date.now()}`,
          customerId: profile.uid,
          driverId: null,
          fuelType: orderForm.fuelType,
          amount: orderForm.amount,
          location,
          status: OrderStatus.PENDING,
          price,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setMyOrders(prev => [newOrder, ...prev]);
        setIsOrdering(false);
        setSuccessMessage("FUGO DELIVERY REQUEST TRANSMITTED.");
        setTimeout(() => setSuccessMessage(null), 4000);
        return;
      }

      const orderId = await createOrder({
        ...orderForm,
        location,
        price,
      });
      if (orderId) {
        setIsOrdering(false);
        setSuccessMessage("FUGO DELIVERY REQUEST TRANSMITTED.");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (error) {
      console.error("Failed to create order", error);
    }
  };

  const allVisibleOrders = [...availableJobs, ...myOrders];
  const activeUserOrders = myOrders.filter(o => o.customerId === profile.uid && o.status !== OrderStatus.COMPLETED);
  const pendingIncomingOrders = availableJobs.filter(o => o.status === OrderStatus.PENDING); // Extra safety filter
  const myAcceptedOrders = myOrders.filter(o => (o.driverId === profile.uid) && o.status !== OrderStatus.COMPLETED);

  useEffect(() => {
    if (profile.uid === 'guest-id') {
      console.log('Fugo Elite Debug: Guest Mode Active', { 
        role: profile.role, 
        jobCount: pendingIncomingOrders.length, 
        myOrderCount: myOrders.length,
        acceptedCount: myAcceptedOrders.length
      });
    }
  }, [profile.role, pendingIncomingOrders.length, myOrders.length, myAcceptedOrders.length]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) setNotifPermission('granted');
    else setNotifPermission('denied');
  };

  return (
    <div className="h-full relative">
      {notifPermission === 'default' && profile.role !== UserRole.CUSTOMER && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xs pointer-events-none">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-black/80 backdrop-blur-xl border border-gold-500/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-gold-500 animate-pulse" />
              <p className="text-[10px] text-white font-bold uppercase tracking-wider">Enable Critical Alerts</p>
            </div>
            <button 
              onClick={handleEnableNotifications}
              className="bg-gold-500 text-black text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase"
            >
              Enable
            </button>
          </motion.div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-32 z-50 flex justify-center pointer-events-none">
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-gold-500 text-black px-8 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 backdrop-blur-xl border-4 border-black/10 pointer-events-auto"
            >
              <Check size={24} />
              <span className="uppercase tracking-widest text-xs italic">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute inset-0">
        <MapView 
          markers={[
            ...allVisibleOrders.map(o => ({ 
              id: o.id, 
              position: o.location, 
              type: 'order' as const 
            })),
            ...sosAlerts.map(s => ({ 
              id: s.id, 
              position: s.location, 
              type: 'sos' as const 
            }))
          ]}
        />
      </div>

      {/* Overlays */}
      <div className="absolute top-6 left-6 right-6 pointer-events-none flex flex-col gap-3">
        {/* Active Emergency Alerts */}
        {sosAlerts.length > 0 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-black border-2 border-red-600 p-5 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.3)] pointer-events-auto relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-600/5 animate-pulse" />
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center relative z-10 shadow-lg shadow-red-600/20">
              <ShieldAlert className="text-white" size={32} />
            </div>
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <p className="text-red-500 font-bold text-xs uppercase tracking-[0.2em] italic">Priority Zero Alert</p>
              </div>
              <p className="text-white font-bold text-lg tracking-tight uppercase">Emergency Assistance</p>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{sosAlerts[0].location.address}</p>
            </div>
            <div className="relative z-10">
              <button 
                onClick={() => {
                  setSuccessMessage("SOS LOCATION PINNED. ENGAGING.");
                  setTimeout(() => setSuccessMessage(null), 4000);
                }}
                className="bg-white text-black text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-tighter hover:bg-red-600 hover:text-white transition-colors"
              >
                Respond
              </button>
            </div>
          </motion.div>
        )}

        {/* User Orders Status */}
        {activeUserOrders.map(order => (
          <OrderETADisplay key={order.id} order={order} currencySymbol={currencySymbol} />
        ))}
      </div>

      {/* Driver Job Cards */}
      {profile.role === UserRole.DRIVER && (
          <div className="absolute bottom-32 left-6 right-6 flex flex-col gap-4 pointer-events-none">
              {profile.status === UserStatus.OFFLINE && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/80 border-2 border-red-900/30 p-8 rounded-[40px] backdrop-blur-xl pointer-events-auto text-center"
                >
                   <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                      <Power size={32} className="text-red-500 opacity-50" />
                   </div>
                   <h3 className="text-white font-display font-bold text-2xl italic tracking-tighter uppercase mb-2">Squadron Standby</h3>
                   <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-8">You are currently logged off. Go online to receive high-priority refueling missions.</p>
                   <button 
                    onClick={() => {
                        // This trigger is handled in Layout, but we can show a hint
                        const btn = document.querySelector('button[class*="border-red-500"]');
                        if (btn instanceof HTMLButtonElement) btn.click();
                    }}
                    className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-xs active:scale-95 transition-all shadow-[0_10px_30px_rgba(220,38,38,0.3)]"
                   >
                    Engage Duty
                   </button>
                </motion.div>
              )}

              {myAcceptedOrders.length > 0 && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-black/90 border border-gold-500/50 p-6 rounded-3xl backdrop-blur-xl shadow-2xl pointer-events-auto"
                  >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-gold-400 font-bold text-lg leading-tight italic">ACTIVE DELIVERY</h3>
                            <p className="text-gray-500 text-xs font-medium tracking-widest uppercase mt-1">Order #{myAcceptedOrders[0].id.slice(0, 6)}</p>
                        </div>
                        <div className="bg-gold-500 p-2 rounded-xl text-black">
                            <Navigation2 size={20} />
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3">
                            <MapPin size={16} className="text-gold-500" />
                            <p className="text-sm font-medium text-gray-300">{myAcceptedOrders[0].location.address}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-gold-500" />
                            <p className="text-sm font-medium text-gray-300">{myAcceptedOrders[0].amount} Gal • {myAcceptedOrders[0].fuelType}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                          <button 
                            onClick={() => handleCompleteOrder(myAcceptedOrders[0].id)}
                            className="flex-1 bg-gold-500 hover:bg-gold-400 text-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-gold-500/20"
                          >
                              COMPLETE DROP-OFF
                          </button>
                      </div>
                  </motion.div>
              )}

              {profile.status === UserStatus.ONLINE && myAcceptedOrders.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md pointer-events-auto"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Duty Log • Recent Missions</h3>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-gold-500" />
                      <div className="w-1 h-1 rounded-full bg-gold-500/50" />
                      <div className="w-1 h-1 rounded-full bg-gold-500/20" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: '101', type: 'Premium', status: 'Success', time: '1h ago', earn: 45 },
                      { id: '102', type: 'Diesel', status: 'Incentive', time: '3h ago', earn: 62 },
                    ].map(log => (
                      <div key={log.id} className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gold-900/20 rounded-xl flex items-center justify-center text-gold-500">
                             <Check size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-tighter">Mission #{log.id}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{log.time} • {log.type}</p>
                          </div>
                        </div>
                        <p className="text-gold-500 font-bold text-xs">+{currencySymbol}{log.earn}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {profile.status === UserStatus.ONLINE && (myOrders.length === 0 || (profile.uid === 'guest-id' && myOrders.length <= 1)) && pendingIncomingOrders.length > 0 && pendingIncomingOrders[0] && (
                   <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="bg-black border-2 border-gold-500/50 p-6 rounded-[32px] shadow-[0_0_100px_rgba(247,167,10,0.2)] pointer-events-auto relative overflow-hidden"
                 >
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Fuel size={64} className="text-gold-500" />
                     </div>
                     <div className="flex items-center gap-4 mb-6 relative z-10">
                         <div className="w-14 h-14 bg-gold-500 rounded-full flex items-center justify-center relative shadow-lg shadow-gold-500/30">
                            <Fuel className="text-black" size={28} />
                            <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-gold-500 border-2 border-black"></span>
                            </span>
                         </div>
                         <div>
                             <h4 className="font-bold text-gold-400 uppercase tracking-tighter text-xl leading-tight">Fugo Task Found</h4>
                             <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">{currencySymbol}{(pendingIncomingOrders[0]?.price || 0).toFixed(2)} Credit Potential</p>
                         </div>
                     </div>
                     <button 
                        onClick={() => handleAcceptJob(pendingIncomingOrders[0].id)}
                        className="w-full bg-white text-black font-bold py-5 rounded-3xl flex items-center justify-center gap-3 hover:bg-gold-50 transition-all shadow-2xl relative z-10 active:scale-95"
                    >
                        <span className="tracking-widest text-sm">ENGAGE REQUEST</span>
                        <ChevronRight size={18} />
                    </button>
                 </motion.div>
              )}
          </div>
      )}

      {/* Customer Action Button */}
      {profile.role === UserRole.CUSTOMER && (
        <div className="absolute bottom-32 right-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOrdering(true)}
            className="w-20 h-20 bg-gold-500 text-black rounded-full shadow-2xl flex items-center justify-center transition-all hover:bg-gold-400 border-4 border-black"
          >
            <Plus size={40} />
          </motion.button>
        </div>
      )}

      {/* Order Modal */}
      <AnimatePresence>
        {isOrdering && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrdering(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-[40px] p-8 z-[101] border-t border-gold-900/30"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-display font-bold text-gold-400 italic">REQUEST DELIVERY</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-medium mt-1">High-Speed Fugo Delivery</p>
                </div>
                <button onClick={() => setIsOrdering(false)} className="bg-gray-800 p-2 rounded-full text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 mb-10">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Fuel Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Premium Gasoline', 'Diesel Elite'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setOrderForm(prev => ({ ...prev, fuelType: type }))}
                        className={cn(
                          "px-4 py-3 rounded-2xl border transition-all font-bold text-sm",
                          orderForm.fuelType === type 
                            ? "bg-gold-500/10 border-gold-500 text-gold-400" 
                            : "bg-gray-800 border-transparent text-gray-400"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Amount ({isIndia ? 'Litres' : 'Gallons'})</label>
                  <div className="flex items-center gap-6 bg-gray-800 p-6 rounded-3xl justify-center">
                    <button 
                        onClick={() => setOrderForm(prev => ({ ...prev, amount: Math.max(1, prev.amount - 5) }))}
                        className="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center text-gold-400 hover:bg-gray-700"
                    >-</button>
                    <input 
                      type="number" 
                      value={orderForm.amount}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                      className="bg-transparent text-4xl font-display font-bold text-white text-center w-24 outline-none border-b-2 border-gold-900/30 focus:border-gold-500 transition-colors"
                    />
                    <button 
                        onClick={() => setOrderForm(prev => ({ ...prev, amount: prev.amount + 5 }))}
                        className="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center text-gold-400 hover:bg-gray-700"
                    >+</button>
                  </div>
                </div>

                <div className="bg-gold-950/20 rounded-2xl p-4 flex items-center justify-between border border-gold-900/10">
                    <span className="text-gray-400 font-medium">Estimated Cost</span>
                    <span className="text-2xl font-bold text-gold-400">{currencySymbol}{(orderForm.amount * priceMultiplier).toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCreateOrder}
                className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-5 rounded-3xl shadow-2xl shadow-gold-500/20 transition-all uppercase tracking-widest"
              >
                Confirm Fugo Delivery
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
