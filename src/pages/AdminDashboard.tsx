import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { 
  Package, Truck, CheckCircle, Clock, Users, 
  LayoutGrid, ShoppingBag, MapPin, ChevronRight, 
  ChevronDown, Bike, Store as StoreIcon, BarChart3, 
  Loader2, BellRing, XCircle, Search, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../components/MainLayout";

import SectionsPage from "./SectionsPage";
import CategoriesPage from "./CategoriesPage";
import ProductsPage from "./ProductsPage";
import UsersPage from "./UsersPage"; 
import OrderHistoryPage from "./OrderHistoryPage";
import SettingsPage from "./SettingsPage";
import NotificationsPage from "./NotificationsPage";

const AdminDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [ridersList, setRidersList] = useState<any[]>([]); 
  const [stats, setStats] = useState({ users: 0, products: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  const [incomingOrder, setIncomingOrder] = useState<any | null>(null);
  const beepIntervalRef = useRef<any>(null);

  const fetchRiders = async () => {
    const { data } = await supabase.from('rider_profiles').select('id, full_name, is_busy, is_active');
    if (data) setRidersList(data);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!user_id(*),
          rider_profiles!rider_id(full_name),
          order_items (
            quantity,
            unit_price,
            product_name,
            products!product_id (
              name,
              price
            )
          )
        `) 
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Primary Fetch Error:", error);
      } else {
        setOrders(ordersData || []);
      }

      const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: dCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered');

      setStats({ 
        users: uCount || 0, 
        products: pCount || 0, 
        delivered: dCount || 0 
      });

    } catch (err) {
      console.error("Dashboard Global Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async (orderId: string, riderId: string) => {
    if (!riderId) return;
    try {
      // 1. Assign rider and change status to rider_assigned
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'rider_assigned', 
          rider_id: riderId 
        })
        .eq('id', orderId);

      if (error) throw error;

      // 2. Mark rider as busy
      await supabase.from('rider_profiles').update({ is_busy: true }).eq('id', riderId);
      
      fetchAllData();
    } catch (err: any) {
      alert("Assignment failed: " + err.message);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchRiders(); 
    
    const channel = supabase.channel('admin-sync')
      .on('postgres_changes', { event: 'INSERT', table: 'orders' }, (payload) => {
        setIncomingOrder(payload.new);
        startBeep();
        fetchAllData(); 
      })
      .on('postgres_changes', { event: 'UPDATE', table: 'orders' }, (payload) => {
        fetchAllData();
      })
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
      stopBeep();
    };
  }, []);

  const startBeep = () => {
    if (beepIntervalRef.current) return;
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    beepIntervalRef.current = setInterval(() => {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime); 
      gain.gain.setValueAtTime(0.1, ctx.currentTime); 
      osc.start();
      osc.stop(ctx.currentTime + 0.15); 
    }, 1000); 
  };

  const stopBeep = () => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
  };

  const handleConfirmOrder = async () => {
    if (!incomingOrder) return;
    stopBeep();
    // Default status is 'order placed' on acceptance
    await updateStatus(incomingOrder.id, 'order placed');
    setIncomingOrder(null);
    fetchAllData();
  };

  const handleDeclineOrder = async () => {
    stopBeep();
    if (incomingOrder) {
      await updateStatus(incomingOrder.id, 'cancelled');
    }
    setIncomingOrder(null);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;

      // If finished, free the rider
      if (newStatus === 'delivered' || newStatus === 'cancelled') {
        const order = orders.find(o => o.id === orderId);
        if (order?.rider_id) {
          await supabase.from('rider_profiles').update({ is_busy: false }).eq('id', order.rider_id);
        }
      }
      fetchAllData();
    } catch (err: any) {
      console.error("Status update failed:", err.message);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <MainLayout activeNav={activeNav} setActiveNav={setActiveNav}>
      <AnimatePresence>
        {incomingOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[410] bg-[#12121a] border-2 border-primary/50 shadow-[0_0_50px_rgba(255,153,193,0.3)] w-[90%] max-w-md rounded-[3rem] p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse" />
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4 relative">
                  <BellRing size={40} className="animate-bounce" />
                  <span className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-50" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">Incoming<br/>Order</h3>
                <p className="text-xs font-bold text-white/40 mt-3 uppercase tracking-widest italic">₹{incomingOrder.total_amount} • #{incomingOrder.id?.toString().slice(-6)}</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 mb-8 border border-white/5">
                <p className="text-[9px] font-black uppercase text-white/20 mb-2 tracking-widest flex items-center gap-2"><MapPin size={12}/> target dropoff</p>
                <p className="text-sm font-bold text-white/90 leading-relaxed capitalize">{incomingOrder.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={handleDeclineOrder} className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                  <XCircle size={16} /> Decline
                </button>
                <button onClick={handleConfirmOrder} className="h-14 rounded-2xl bg-primary text-black font-black uppercase text-[10px] tracking-widest hover:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(255,153,193,0.2)]">
                  <CheckCircle size={16} /> Confirm
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {activeNav === 'dashboard' && (
        <div className="lowercase">
          <header className="mb-12 flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black tracking-tighter italic leading-none">Kilogram <span className="text-primary font-black">Admin</span></h2>
              <p className="text-white/20 font-bold uppercase text-[9px] tracking-[0.4em] mt-3">Live Fleet Control Center</p>
            </div>
            <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">System Status</p>
                <p className="text-xs font-black text-green-400 flex items-center gap-2 justify-end mt-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/> Nodes Online</p>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            <StatCard label="Network Users" value={stats.users} icon={<Users size={20}/>} color="text-blue-400" />
            <StatCard label="Inventory List" value={stats.products} icon={<LayoutGrid size={20}/>} color="text-orange-400" />
            <StatCard label="Fleet Success" value={stats.delivered} icon={<CheckCircle size={20}/>} color="text-green-400" />
          </div>

          <div className="flex items-center gap-4 mb-8">
            <BarChart3 size={20} className="text-primary" />
            <h3 className="text-xl font-black tracking-tight text-white italic">Active Pipeline</h3>
          </div>

          <div className="flex flex-col gap-6 pb-20">
            {loading && activeOrders.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-white/10 animate-pulse font-black uppercase text-xs tracking-widest">
                <Loader2 className="animate-spin mr-3" /> Syncing data...
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3.5rem] text-white/10 uppercase font-black text-[10px] tracking-[0.3em]">
                 <ShoppingBag size={48} className="mb-4 opacity-10" />
                 no active flow
              </div>
            ) : activeOrders.map((order) => (
              <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={order.id} className={`bg-white/[0.02] border rounded-[2.5rem] transition-all overflow-hidden ${expandedOrder === order.id ? 'border-primary/40 bg-primary/[0.01]' : 'border-white/5'}`}>
                <div onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="p-7 cursor-pointer flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-7">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${order.status === 'order placed' ? 'bg-orange-500/10 text-orange-400' : 'bg-primary/10 text-primary'}`}>
                      <ShoppingBag size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">#{order.id.toString().slice(-6)}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${order.status === 'order placed' ? 'bg-orange-400 text-black' : 'bg-primary text-black'}`}>{order.status.replace('_', ' ')}</span>
                      </div>
                      <h4 className="text-xl font-black text-white">₹{order.total_amount}</h4>
                      
                      {/* Rider Logic: Show name only if assigned, else show dropdown */}
                      {order.rider_id && order.rider_profiles?.full_name ? (
                        <p className="text-[9px] font-black uppercase text-primary tracking-widest mt-1.5 italic flex items-center gap-2">
                          <Bike size={12} /> partner: {order.rider_profiles.full_name}
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                           <div className="flex items-center gap-2 text-orange-400 animate-pulse">
                              <Search size={12} />
                              <span className="text-[9px] font-black uppercase tracking-widest">assigning rider...</span>
                           </div>
                           <div className="relative group w-fit">
                              <select 
                                onChange={(e) => handleManualAssign(order.id, e.target.value)}
                                className="bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest rounded-lg px-3 py-2 outline-none focus:border-primary/50 text-white/60 appearance-none pr-8 cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>Select Rider</option>
                                {ridersList.map(rider => (
                                  <option key={rider.id} value={rider.id} disabled={rider.is_busy || !rider.is_active}>
                                    {rider.full_name} {rider.is_busy ? '(Busy)' : !rider.is_active ? '(Offline)' : ''}
                                  </option>
                                ))}
                              </select>
                              <UserPlus size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-black capitalize text-white/90">{order.profiles?.full_name || 'kilogram user'}</p>
                      <p className="text-[10px] font-bold text-white/20 truncate w-40 mt-1 uppercase tracking-tighter">{order.address}</p>
                    </div>
                    {expandedOrder === order.id ? <ChevronDown size={20} className="text-primary"/> : <ChevronRight size={20} className="text-white/10"/>}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/20">
                      <div className="px-10 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-10 border-t border-white/5 pt-10">
                        <div className="space-y-5">
                           <h5 className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Live Route Simulation</h5>
                           <div className="h-48 bg-black/40 rounded-[3rem] border border-white/5 relative overflow-hidden flex items-center justify-center shadow-inner mb-6">
                              <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg"><StoreIcon size={20} className="text-white/40"/></div>
                                <span className="text-[9px] font-black uppercase text-white/20">Hub</span>
                              </div>
                              <div className="w-[45%] h-px border-t border-dashed border-white/20 relative">
                                <motion.div animate={{ x: (order.status === 'order placed') ? '0%' : (order.status === 'out_for_delivery') ? '100%' : '50%' }} transition={{ type: 'spring', damping: 25 }} className="absolute -top-5 left-0 text-primary">
                                  <Bike size={40} fill="currentColor" className="drop-shadow-[0_0_10px_rgba(255,153,193,0.5)]" />
                                </motion.div>
                              </div>
                              <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg"><MapPin size={20}/></div>
                                <span className="text-[9px] font-black uppercase text-primary">User</span>
                              </div>
                           </div>

                           <h5 className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Order Manifest</h5>
                           <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 space-y-3">
                              {order.order_items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                   <div className="flex flex-col">
                                      <span className="text-sm font-bold text-white/90 capitalize">{item.products?.name || item.product_name}</span>
                                      <span className="text-[10px] font-bold text-white/30">QTY: {item.quantity}</span>
                                   </div>
                                   <span className="text-sm font-black text-primary italic">₹{item.unit_price * item.quantity}</span>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="flex flex-col justify-center">
                           <h5 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-5 px-1">Node Status Control</h5>
                           <div className="grid grid-cols-2 gap-3 mb-4">
                              <StatusBtn active={order.status === 'order placed'} icon={<Package size={22}/>} label="Placed" onClick={() => updateStatus(order.id, 'order placed')} />
                              <StatusBtn active={order.status === 'order packed'} icon={<Clock size={22}/>} label="Packed" onClick={() => updateStatus(order.id, 'order packed')} />
                              <StatusBtn active={order.status === 'rider_assigned'} icon={<UserPlus size={22}/>} label="Rider Set" onClick={() => {}} />
                              <StatusBtn active={order.status === 'out_for_delivery'} icon={<Truck size={22}/>} label="On Way" onClick={() => updateStatus(order.id, 'out_for_delivery')} />
                           </div>
                           <button onClick={() => updateStatus(order.id, 'delivered')} className="w-full h-16 bg-green-500 hover:bg-green-600 rounded-[1.5rem] text-white font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-[0_15px_30px_rgba(34,197,94,0.2)]">
                             <CheckCircle size={20}/> Mark as Complete
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeNav === 'sections' && <SectionsPage />}
      {activeNav === 'categories' && <CategoriesPage />}
      {activeNav === 'products' && <ProductsPage />}
      {activeNav === 'users' && <UsersPage />}
      {activeNav === 'history' && <OrderHistoryPage orders={orders} />}
      {activeNav === 'notifications' && <NotificationsPage />}
      {activeNav === 'settings' && <SettingsPage />}
    </MainLayout>
  );
};

const StatusBtn = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-3 py-6 rounded-[2rem] border transition-all active:scale-95 ${active ? 'bg-primary border-primary text-black' : 'bg-white/[0.03] border-white/5 text-white/30 hover:border-white/20'}`}>
    {icon}
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white/[0.02] border border-white/5 p-9 rounded-[3rem] relative overflow-hidden group hover:border-white/10 transition-colors">
    <div className={`absolute -right-6 -top-6 opacity-5 scale-[2] transition-transform group-hover:scale-[2.2] ${color}`}>{icon}</div>
    <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] mb-3">{label}</p>
    <span className="text-5xl font-black italic text-white tracking-tighter">{value}</span>
  </div>
);

export default AdminDashboard;