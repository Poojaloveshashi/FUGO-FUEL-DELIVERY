import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Fuel, 
  Wrench, 
  Truck, 
  Layers, 
  Database, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Package, 
  MapPin, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpDown,
  Building2,
  Warehouse as WarehouseIcon,
  Store
} from 'lucide-react';
import { 
  Order, 
  FulfilmentCategory, 
  WarehouseStockItem, 
  OfflineOutlet 
} from '../types';
import { 
  CONNECTED_CUSTOMER_APPLET_ID, 
  CONNECTED_CUSTOMER_APPLET_URL 
} from '../lib/crossAppSync';

interface CentralSystemArchitectureProps {
  orders: Order[];
  activeCategory: FulfilmentCategory;
  onSelectCategory: (cat: FulfilmentCategory) => void;
  onSimulateAppOrder?: (type: 'FUEL' | 'REPAIR' | 'SERVICE') => void;
  currencySymbol?: string;
  defaultExpanded?: boolean;
}

export const INITIAL_WAREHOUSE_STOCK: WarehouseStockItem[] = [
  { id: 'stk_dsl', name: 'High Speed Diesel (Generator & Fleet)', category: 'fuel', quantity: 4850, unit: 'Liters', minThreshold: 1000 },
  { id: 'stk_pet', name: 'Petrol Speed 95 (Premium Octane)', category: 'fuel', quantity: 3200, unit: 'Liters', minThreshold: 800 },
  { id: 'stk_bat', name: 'Heavy Duty 12V Exide Batteries', category: 'parts', quantity: 18, unit: 'Units', minThreshold: 5 },
  { id: 'stk_oil', name: 'Mobil 1 Fully Synthetic Oil (5L)', category: 'parts', quantity: 42, unit: 'Cans', minThreshold: 10 },
  { id: 'stk_tyr', name: 'Tubeless Repair & Inflation Kits', category: 'parts', quantity: 15, unit: 'Kits', minThreshold: 4 },
];

export const INITIAL_OFFLINE_OUTLETS: OfflineOutlet[] = [
  { id: 'out_gachibowli', name: 'Gachibowli Node 01 (DLF Road)', type: 'pump', address: 'Plot 4, DLF Cybercity, Gachibowli, Hyderabad', lat: 17.4435, lng: 78.3582, isOpen: true, fuelAvailable: true },
  { id: 'out_nallagandla', name: 'Nallagandla Express Hub & Garage', type: 'garage', address: 'Near Aparna Sarovar Grande, Nallagandla', lat: 17.4820, lng: 78.3090, isOpen: true, fuelAvailable: true },
  { id: 'out_madhapur', name: 'Madhapur Mindspace Auto Hub', type: 'hub', address: 'Raheja Mindspace Circle, Madhapur, Hyderabad', lat: 17.4374, lng: 78.3842, isOpen: true, fuelAvailable: true },
];

export default function CentralSystemArchitecture({
  orders,
  activeCategory,
  onSelectCategory,
  onSimulateAppOrder,
  currencySymbol = '₹',
  defaultExpanded = true,
}: CentralSystemArchitectureProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedInspect, setSelectedInspect] = useState<'NONE' | 'CENTRAL' | 'OUTLETS' | 'WAREHOUSE'>('NONE');
  const [stockList, setStockList] = useState<WarehouseStockItem[]>(INITIAL_WAREHOUSE_STOCK);

  // Computed metrics from Central system orders
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const inTransitOrders = orders.filter(o => o.status === 'IN_TRANSIT' || o.status === 'ACCEPTED');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);

  // Categorized counts for fulfillment units
  const deliveryOrdersCount = orders.filter(o => (o.service_type || o.serviceType || 'FUEL') === 'FUEL').length;
  const mechanicsOrdersCount = orders.filter(o => (o.service_type || o.serviceType) === 'MAINTENANCE' || (o.fuelType && o.fuelType.toLowerCase().includes('repair'))).length;
  const transportOrdersCount = orders.filter(o => (o.service_type || o.serviceType) === 'TRANSPORT' || o.job_kind).length;

  return (
    <div className="bg-[#121316] border border-white/10 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden">
      {/* Header with Expand Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
              Ecosystem Architecture
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">
              Live Central System & Fulfilment Routing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCategory !== 'ALL' && (
            <button
              onClick={() => onSelectCategory('ALL')}
              className="text-[10px] font-bold uppercase tracking-wider text-gold-400 hover:text-gold-300 bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/20"
            >
              Reset Filter
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse Architecture Diagram' : 'Expand Architecture Diagram'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* ROW 1: Client Apps (Fuel app, Repairs app, Service app) */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. Fuel app */}
              <div 
                onClick={() => onSimulateAppOrder?.('FUEL')}
                className="group relative bg-[#09352e] hover:bg-[#0c443b] border border-[#145d50] hover:border-emerald-400/60 rounded-2xl p-3 text-center cursor-pointer transition-all active:scale-95 shadow-md flex flex-col items-center justify-center min-h-[78px]"
                title="Click to simulate incoming order from Fuel App"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-300">
                  <Fuel size={14} />
                  <span className="font-bold text-xs uppercase tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    Fuel app
                  </span>
                </div>
                <span className="text-[9px] text-emerald-200/70 font-mono">
                  {deliveryOrdersCount} orders active
                </span>
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* 2. Repairs app */}
              <div 
                onClick={() => onSimulateAppOrder?.('REPAIR')}
                className="group relative bg-[#09352e] hover:bg-[#0c443b] border border-[#145d50] hover:border-emerald-400/60 rounded-2xl p-3 text-center cursor-pointer transition-all active:scale-95 shadow-md flex flex-col items-center justify-center min-h-[78px]"
                title="Click to simulate incoming order from Repairs App"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-300">
                  <Wrench size={14} />
                  <span className="font-bold text-xs uppercase tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    Repairs app
                  </span>
                </div>
                <span className="text-[9px] text-emerald-200/70 font-mono">
                  Roadside assist
                </span>
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>

              {/* 3. Service app */}
              <div 
                onClick={() => onSimulateAppOrder?.('SERVICE')}
                className="group relative bg-[#09352e] hover:bg-[#0c443b] border border-[#145d50] hover:border-emerald-400/60 rounded-2xl p-3 text-center cursor-pointer transition-all active:scale-95 shadow-md flex flex-col items-center justify-center min-h-[78px]"
                title="Click to simulate incoming order from Service App"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-300">
                  <Truck size={14} />
                  <span className="font-bold text-xs uppercase tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    Service app
                  </span>
                </div>
                <span className="text-[9px] text-emerald-200/70 font-mono">
                  {transportOrdersCount} pickup/drop
                </span>
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* SYNC ARROWS ↕ */}
            <div className="flex justify-around text-gray-500 py-0.5">
              <span className="text-sm font-bold animate-bounce select-none">↕</span>
              <span className="text-sm font-bold animate-bounce select-none delay-100">↕</span>
              <span className="text-sm font-bold animate-bounce select-none delay-200">↕</span>
            </div>

            {/* ROW 2: Central system */}
            <div 
              onClick={() => setSelectedInspect(selectedInspect === 'CENTRAL' ? 'NONE' : 'CENTRAL')}
              className="bg-gradient-to-r from-[#322c6e] via-[#3a3382] to-[#322c6e] border border-[#5249a5] hover:border-indigo-400/80 rounded-2xl p-3.5 text-center cursor-pointer transition-all shadow-lg relative group"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Database size={16} className="text-indigo-300" />
                <h4 className="font-display font-black text-sm uppercase tracking-wider text-white">
                  Central system
                </h4>
              </div>
              <p className="text-[11px] text-indigo-200/90 font-medium tracking-tight">
                Same users, orders, payments, stock
              </p>

              {/* Sub-metrics bar */}
              <div className="mt-2.5 pt-2 border-t border-white/10 grid grid-cols-4 gap-1 text-[9px] text-indigo-200/80 font-mono">
                <div>Users: <strong className="text-white">Active</strong></div>
                <div>Orders: <strong className="text-white">{orders.length}</strong></div>
                <div>Rev: <strong className="text-emerald-300">{currencySymbol}{totalRevenue}</strong></div>
                <div>Stock: <strong className="text-white">8,050L</strong></div>
              </div>

              <span className="absolute top-2 right-2 text-[9px] font-mono text-indigo-300 bg-white/10 px-1.5 py-0.5 rounded">
                Supabase Live
              </span>
            </div>

            {/* CENTRAL SYSTEM DETAILS DRAWER */}
            {selectedInspect === 'CENTRAL' && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/60 border border-indigo-500/30 rounded-2xl p-3 text-xs space-y-2 font-mono"
              >
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>SHARED POSTGRES DATABASE</span>
                  <span className="text-indigo-300">arierwpjaksxxnmvbqwn</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-gray-400 block text-[9px]">PENDING</span>
                    <strong className="text-amber-400 text-sm">{pendingOrders.length}</strong>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-gray-400 block text-[9px]">IN TRANSIT</span>
                    <strong className="text-blue-400 text-sm">{inTransitOrders.length}</strong>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-gray-400 block text-[9px]">COMPLETED</span>
                    <strong className="text-emerald-400 text-sm">{completedOrders.length}</strong>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SYNC ARROW ↕ */}
            <div className="flex justify-center text-gray-500 py-0.5">
              <span className="text-sm font-bold animate-bounce select-none">↕</span>
            </div>

            {/* ROW 3: Fulfilment Container (dashed border matching diagram) */}
            <div className="border border-dashed border-gray-700 rounded-3xl p-3.5 bg-black/40 space-y-3">
              <div className="flex items-center justify-between text-gray-400 text-[11px] font-bold uppercase tracking-wider px-1">
                <span>Fulfilment</span>
                <span className="text-[9px] text-gray-500 lowercase font-mono">
                  click card to filter or view stock
                </span>
              </div>

              {/* 2x2 Grid of Fulfilment Units */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Delivery (Fuel drop-offs) */}
                <div 
                  onClick={() => onSelectCategory('DELIVERY')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-left flex flex-col justify-between min-h-[82px] active:scale-95 ${
                    activeCategory === 'DELIVERY'
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                      : 'bg-[#1b1c21] hover:bg-[#23242b] border-white/5 text-gray-200'
                  }`}
                >
                  <div>
                    <h5 className="font-display font-bold text-sm text-white">Delivery</h5>
                    <p className="text-[10px] text-gray-400 font-medium">Fuel drop-offs</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-gold-400">{deliveryOrdersCount} active drop-offs</span>
                    <span className="text-xs">🚚</span>
                  </div>
                </div>

                {/* 2. Mechanics (Repairs + service) */}
                <div 
                  onClick={() => onSelectCategory('MECHANICS')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-left flex flex-col justify-between min-h-[82px] active:scale-95 ${
                    activeCategory === 'MECHANICS'
                      ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg'
                      : 'bg-[#1b1c21] hover:bg-[#23242b] border-white/5 text-gray-200'
                  }`}
                >
                  <div>
                    <h5 className="font-display font-bold text-sm text-white">Mechanics</h5>
                    <p className="text-[10px] text-gray-400 font-medium">Repairs + service</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-purple-300">Diagnostics & repair</span>
                    <span className="text-xs">🔧</span>
                  </div>
                </div>

                {/* 3. Offline outlets (Pumps, garages) */}
                <div 
                  onClick={() => setSelectedInspect(selectedInspect === 'OUTLETS' ? 'NONE' : 'OUTLETS')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-left flex flex-col justify-between min-h-[82px] active:scale-95 ${
                    selectedInspect === 'OUTLETS'
                      ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg'
                      : 'bg-[#1b1c21] hover:bg-[#23242b] border-white/5 text-gray-200'
                  }`}
                >
                  <div>
                    <h5 className="font-display font-bold text-sm text-white">Offline outlets</h5>
                    <p className="text-[10px] text-gray-400 font-medium">Pumps, garages</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-blue-300">{INITIAL_OFFLINE_OUTLETS.length} Nodes in HYD</span>
                    <span className="text-xs">⛽</span>
                  </div>
                </div>

                {/* 4. Warehouse (Fuel + parts stock) */}
                <div 
                  onClick={() => setSelectedInspect(selectedInspect === 'WAREHOUSE' ? 'NONE' : 'WAREHOUSE')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-left flex flex-col justify-between min-h-[82px] active:scale-95 ${
                    selectedInspect === 'WAREHOUSE'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                      : 'bg-[#1b1c21] hover:bg-[#23242b] border-white/5 text-gray-200'
                  }`}
                >
                  <div>
                    <h5 className="font-display font-bold text-sm text-white">Warehouse</h5>
                    <p className="text-[10px] text-gray-400 font-medium">Fuel + parts stock</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-emerald-300">{stockList.length} items logged</span>
                    <span className="text-xs">📦</span>
                  </div>
                </div>
              </div>

              {/* OFFLINE OUTLETS INSPECT DRAWER */}
              {selectedInspect === 'OUTLETS' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-black/70 border border-blue-500/40 rounded-2xl p-3 text-xs space-y-2 mt-2"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-blue-400 border-b border-white/10 pb-1.5">
                    <span>Offline Outlets (Pumps & Garages)</span>
                    <span>Hyderabad Hubs</span>
                  </div>
                  <div className="space-y-1.5">
                    {INITIAL_OFFLINE_OUTLETS.map(outlet => (
                      <div key={outlet.id} className="flex items-center justify-between bg-white/5 p-2 rounded-xl text-[11px]">
                        <div>
                          <p className="font-bold text-white">{outlet.name}</p>
                          <p className="text-[9px] text-gray-400">{outlet.address}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                          {outlet.type.toUpperCase()} OPEN
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* WAREHOUSE STOCK INSPECT DRAWER */}
              {selectedInspect === 'WAREHOUSE' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-black/70 border border-emerald-500/40 rounded-2xl p-3 text-xs space-y-2 mt-2"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-emerald-400 border-b border-white/10 pb-1.5">
                    <span>Warehouse Inventory (Fuel & Parts)</span>
                    <span>Live Stock</span>
                  </div>
                  <div className="space-y-1.5">
                    {stockList.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white/5 p-2 rounded-xl text-[11px]">
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <p className="text-[9px] text-gray-400 font-mono">Category: {item.category.toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-300 font-mono">{item.quantity.toLocaleString()} {item.unit}</p>
                          <span className="text-[8px] text-emerald-400">In Stock</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
