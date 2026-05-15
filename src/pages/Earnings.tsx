import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight,
  User,
  History,
  TrendingDown,
  Fuel,
  Package,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { UserProfile, UserRole, Order, OrderStatus } from '../types';
import { subscribeToCustomerOrders, subscribeToDriverOrderHistory, updateOrderStatus } from '../services/store';

const initialMockData = [
  { day: 'Mon', earnings: 120 },
  { day: 'Tue', earnings: 180 },
  { day: 'Wed', earnings: 150 },
  { day: 'Thu', earnings: 220 },
  { day: 'Fri', earnings: 300 },
  { day: 'Sat', earnings: 450 },
  { day: 'Sun', earnings: 100 },
];

interface EarningsProps {
  profile?: UserProfile;
}

export default function Earnings({ profile }: EarningsProps) {
  const isIndia = ['Asia/Calcutta', 'Asia/Kolkata'].includes(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const currencySymbol = isIndia ? '₹' : '$';
  const isDriver = profile?.role === UserRole.DRIVER;
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setIsProcessingCancel(true);
    try {
      if (profile?.uid === 'guest-id') {
        setOrders(prev => prev.map(o => o.id === cancellingOrder.id ? { ...o, status: OrderStatus.CANCELLED } : o));
      } else {
        await updateOrderStatus(cancellingOrder.id, OrderStatus.CANCELLED);
      }
      setCancellingOrder(null);
    } catch (err) {
      console.error("Failed to cancel order", err);
    } finally {
      setIsProcessingCancel(false);
    }
  };

  useEffect(() => {
    if (!profile) return;

    if (profile.uid === 'guest-id') {
      const mockOrders: Order[] = isDriver ? [
        {
          id: 'mock-1',
          customerId: 'cust-1',
          driverId: 'guest-id',
          status: OrderStatus.COMPLETED,
          fuelType: 'Premium Gasoline',
          amount: 25,
          location: { lat: 0, lng: 0, address: 'Elite Residence, Palo Alto' },
          price: isIndia ? 8750 : 112.50,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'mock-2',
          customerId: 'cust-2',
          driverId: 'guest-id',
          status: OrderStatus.COMPLETED,
          fuelType: 'Diesel Heavy',
          amount: 50,
          location: { lat: 0, lng: 0, address: 'Construction Site B' },
          price: isIndia ? 17500 : 225.00,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        }
      ] : [
        {
          id: 'mock-3',
          customerId: 'guest-id',
          driverId: 'driver-1',
          status: OrderStatus.COMPLETED,
          fuelType: 'Premium Gasoline',
          amount: 15,
          location: { lat: 0, lng: 0, address: 'Home Office' },
          price: isIndia ? 5250 : 67.50,
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          updatedAt: new Date(Date.now() - 43200000).toISOString()
        }
      ];
      setOrders(mockOrders);
      return;
    }

    const unsub = isDriver 
      ? subscribeToDriverOrderHistory(profile.uid, setOrders)
      : subscribeToCustomerOrders(profile.uid, setOrders);

    return () => unsub();
  }, [profile?.uid, profile?.role, isDriver, isIndia]);

  const totalValue = orders.reduce((acc, curr) => acc + (curr.status === OrderStatus.COMPLETED ? curr.price : 0), 0);
  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
  const avgValue = completedOrders.length > 0 ? totalValue / completedOrders.length : 0;

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return (
    <div className="p-6 pb-24 overflow-y-auto h-full space-y-8 bg-black no-scrollbar">
      <header>
          <p className="text-gold-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{isDriver ? 'Driver Wallet' : 'Consumer Analytics'}</p>
          <h2 className="text-3xl font-display font-bold italic tracking-tighter text-white uppercase">{isDriver ? 'Revenue Hub' : 'Order Vault'}</h2>
      </header>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-gold-600 to-gold-950 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/10">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            {isDriver ? <TrendingUp size={120} className="text-white" /> : <Package size={120} className="text-white" />}
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-white/70 text-xs font-bold uppercase tracking-widest">{isDriver ? 'Total Earnings' : 'Total Fuel Spend'}</span>
                {completedOrders.length > 0 && (
                  <div className="flex items-center text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-bold">
                      <ArrowUpRight size={10} />
                      <span>Live Ledger</span>
                  </div>
                )}
            </div>
            <h1 className="text-6xl font-display font-bold text-white tracking-tighter italic">{currencySymbol}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
            
            <div className="mt-10 grid grid-cols-2 gap-4">
                <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <p className="text-white/60 text-[10px] font-bold uppercase mb-1">Avg per {isDriver ? 'Job' : 'Trip'}</p>
                    <p className="text-xl font-bold text-white tracking-tight">{currencySymbol}{avgValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <p className="text-white/60 text-[10px] font-bold uppercase mb-1">{isDriver ? 'Successful Missions' : 'Fuel Cycles'}</p>
                    <p className="text-xl font-bold text-white tracking-tight">{completedOrders.length} {isDriver ? 'Missions' : 'Cycles'}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Logic to adapt chart data if necessary or keep static-ish trend */}
      <section className="bg-gray-900/40 border border-gold-900/20 p-6 rounded-[32px] backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-white font-bold uppercase tracking-widest text-xs italic">{isDriver ? 'Performance Analytics' : 'Consumption Trend'}</h3>
            <div className="flex gap-2">
                <button className="bg-gold-500 text-black px-4 py-1.5 rounded-full text-[10px] font-bold">LIVE</button>
            </div>
        </div>
        
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={initialMockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f7a70a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f7a70a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#f7a70a" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEarnings)" 
                />
                <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #743a0e', borderRadius: '16px' }}
                    itemStyle={{ color: '#f7a70a', fontWeight: 'bold' }}
                />
              </AreaChart>
            </ResponsiveContainer>
        </div>
      </section>

      {/* Detailed Operational History */}
      <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold uppercase tracking-widest text-xs italic">{isDriver ? 'Mission Logs' : 'Refueling Ledger'}</h3>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{sortedOrders.length} Records Found</p>
          </div>
          
          <div className="space-y-4">
            {sortedOrders.length === 0 ? (
              <div className="bg-gray-900/20 border border-dashed border-white/10 p-12 rounded-[32px] text-center">
                <Package className="mx-auto text-gray-800 mb-4" size={40} />
                <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">No Protocol History Found</p>
              </div>
            ) : (
              sortedOrders.map(order => {
                const date = order.createdAt?.seconds 
                  ? new Date(order.createdAt.seconds * 1000) 
                  : new Date(order.createdAt);
                
                const statusColor = {
                  [OrderStatus.COMPLETED]: 'text-green-400',
                  [OrderStatus.PENDING]: 'text-gold-500',
                  [OrderStatus.ACCEPTED]: 'text-blue-400',
                  [OrderStatus.DELIVERING]: 'text-purple-400',
                  [OrderStatus.CANCELLED]: 'text-red-500',
                }[order.status];

                const StatusIcon = {
                  [OrderStatus.COMPLETED]: CheckCircle2,
                  [OrderStatus.PENDING]: Clock,
                  [OrderStatus.ACCEPTED]: History,
                  [OrderStatus.DELIVERING]: TrendingUp,
                  [OrderStatus.CANCELLED]: AlertCircle,
                }[order.status];

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={order.id} 
                    className="bg-gray-900/60 border border-white/5 p-5 rounded-[2.5rem] group hover:border-gold-500/20 transition-all backdrop-blur-md"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 ${statusColor} group-hover:scale-110 transition-transform`}>
                          <StatusIcon size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="text-sm font-bold text-white tracking-tighter uppercase">{order.fuelType}</p>
                             <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-gray-500 font-bold uppercase tracking-widest">#{order.id.slice(-4).toUpperCase()}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-display font-bold text-xl tracking-tighter ${isDriver ? 'text-green-400' : 'text-white'}`}>
                          {isDriver ? '+' : ''}{currencySymbol}{order.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic">{order.status}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <Package size={12} className="text-gold-500" />
                          <span>{order.amount} L Units</span>
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                          <Activity size={12} className="text-gold-500 flex-shrink-0" />
                          <span className="truncate">{order.location.address || 'Elite Sector'}</span>
                       </div>
                    </div>

                    {!isDriver && (order.status === OrderStatus.PENDING || order.status === OrderStatus.ACCEPTED) && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                        <button 
                          onClick={() => setCancellingOrder(order)}
                          className="flex items-center gap-2 text-red-500/70 hover:text-red-500 transition-colors text-[9px] font-bold uppercase tracking-widest bg-red-500/5 px-4 py-2 rounded-xl border border-red-500/10 hover:border-red-500/30"
                        >
                          <Trash2 size={12} />
                          <span>Abort Mission</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
      </section>

      {/* Cancellation Confirmation Dialog */}
      <AnimatePresence>
        {cancellingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 p-8 rounded-[40px] w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
              
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/30">
                 <AlertCircle size={32} className="text-red-500" />
              </div>

              <h3 className="text-white font-display font-bold text-2xl italic tracking-tighter text-center uppercase mb-2">Confirm Abortion</h3>
              <p className="text-gray-500 text-xs font-bold text-center uppercase tracking-widest mb-8">
                Are you sure you want to terminate mission #{cancellingOrder.id.slice(-4).toUpperCase()}? This action is irreversible within the current protocol.
              </p>

              <div className="space-y-3">
                <button 
                  disabled={isProcessingCancel}
                  onClick={handleCancelOrder}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-xs transition-all shadow-[0_10px_20px_rgba(220,38,38,0.2)] active:scale-95"
                >
                  {isProcessingCancel ? 'Processing...' : 'Confirm Disconnect'}
                </button>
                <button 
                  disabled={isProcessingCancel}
                  onClick={() => setCancellingOrder(null)}
                  className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-4 rounded-2xl uppercase tracking-widest text-xs transition-all border border-white/5"
                >
                  Return to Ledger
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
