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
  Wrench,
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

import { cn } from '../lib/utils';

export default function Earnings({ profile }: EarningsProps) {
  const isIndia = ['Asia/Calcutta', 'Asia/Kolkata'].includes(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const currencySymbol = isIndia ? '₹' : '$';
  const isDriver = profile?.role === UserRole.DRIVER;
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  useEffect(() => {
    if (!profile) return;

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
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto no-scrollbar pb-24">
      {/* Dynamic Header */}
      <div className="bg-white p-8 border-b border-gray-100 sticky top-0 z-50">
         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mb-1">Service Wallet</p>
         <h2 className="text-3xl font-display font-bold italic tracking-tighter text-gray-900 uppercase">
           {isDriver ? 'Revenue Hub' : 'Service Vault'}
         </h2>
      </div>

      <div className="p-6 space-y-8 max-w-lg mx-auto w-full">
        {/* Weekly Summary Card */}
        <div className="bg-black p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp size={140} className="text-gold-500" />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  {isDriver ? 'Weekly Revenue Estimate' : 'Weekly Service Spend'}
                </span>
                <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse" />
              </div>
              <h1 className="text-6xl font-display font-bold italic tracking-tighter mb-8">
                {currencySymbol}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </h1>
              
              <div className="flex gap-4">
                 <div className="flex-1 bg-white/5 border border-white/10 p-5 rounded-3xl">
                    <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Today</p>
                    <p className="text-lg font-bold">{currencySymbol}{(totalValue * 0.4).toFixed(0)}</p>
                 </div>
                 <div className="flex-1 bg-white/5 border border-white/10 p-5 rounded-3xl">
                    <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Incentives</p>
                    <p className="text-lg font-bold text-gold-500">{currencySymbol}{(totalValue * 0.1).toFixed(0)}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Breakdown Section */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-gray-900 font-bold uppercase tracking-widest text-[10px]">Protocol Performance</h3>
              <Calendar size={14} className="text-gray-300" />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                       <Clock size={16} />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Online Time</span>
                 </div>
                 <p className="text-xl font-bold text-gray-900">42h 15m</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                       <CheckCircle2 size={16} />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Repairs Done</span>
                 </div>
                 <p className="text-xl font-bold text-gray-900">{completedOrders.length}</p>
              </div>
           </div>
        </section>

        {/* History List */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-gray-900 font-bold uppercase tracking-widest text-[10px]">Activity Ledger</h3>
              <History size={14} className="text-gray-300" />
           </div>

           <div className="space-y-4">
              {sortedOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-[40px] text-center border-2 border-dashed border-gray-100">
                   <Package className="text-gray-200 mx-auto mb-4" size={48} />
                   <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">No Operations Found</p>
                </div>
              ) : (
                sortedOrders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          order.status === OrderStatus.COMPLETED ? "bg-emerald-50 text-emerald-600" : "bg-gold-50 text-gold-600"
                        )}>
                           {order.status === OrderStatus.COMPLETED ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{order.fuelType}</p>
                              <span className="text-[8px] bg-gray-50 px-1.5 py-0.5 rounded text-gray-400 font-bold">#{order.id.slice(-4).toUpperCase()}</span>
                           </div>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[120px] mt-0.5">
                              {order.location.address}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={cn("text-lg font-bold tracking-tight", isDriver ? "text-emerald-600" : "text-gray-900")}>
                           {isDriver ? '+' : ''}{currencySymbol}{order.price.toFixed(0)}
                        </p>
                        <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">{order.status}</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </section>
      </div>
    </div>
  );
}

