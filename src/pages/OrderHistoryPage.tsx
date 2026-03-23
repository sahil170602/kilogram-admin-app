import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  History, Search, Calendar, Filter, 
  ChevronDown, IndianRupee, Package, 
  ExternalLink, TrendingUp, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    setLoading(true);
    // Fetch orders with profile info AND nested order_items
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(full_name, phone_number), order_items(*)')
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
      const total = data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
      setTotalRevenue(total);
    }
    setLoading(false);
  };

  const filteredOrders = orders.filter(o => 
    o.id.includes(searchQuery) || 
    o.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="lowercase pb-20">
      {/* TOP HEADER & ANALYTICS */}
      <header className="mb-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <History className="text-primary" size={24} />
            <h2 className="text-3xl font-black tracking-tighter">sales archive</h2>
          </div>
          <p className="text-white/20 font-bold uppercase text-[10px] tracking-[0.4em]">total transaction history</p>
        </div>

        <div className="flex flex-wrap gap-4">
           <div className="bg-primary/10 border border-primary/20 px-8 py-4 rounded-[2rem] flex items-center gap-4">
              <TrendingUp size={20} className="text-primary" />
              <div>
                <p className="text-[9px] font-black text-primary uppercase">all-time revenue</p>
                <p className="text-2xl font-black">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
           </div>
           
           <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                type="text" placeholder="order id or name..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-primary text-white"
              />
           </div>
        </div>
      </header>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-white/10 italic animate-pulse">loading history...</div>
        ) : filteredOrders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

const OrderRow = ({ order }: { order: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden transition-all ${isOpen ? 'bg-white/[0.04] border-white/20' : ''}`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
      >
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
            <Package size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">#{order.id.slice(0, 8)}</span>
            <h4 className="text-sm font-black text-white/90">{order.profiles?.full_name || 'guest'}</h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 md:gap-12">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/20 uppercase">status</span>
            <span className={`text-[10px] font-black uppercase ${order.status === 'delivered' ? 'text-green-400' : 'text-primary'}`}>
              {order.status}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/20 uppercase">date</span>
            <span className="text-xs font-bold text-white/60">
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/20 uppercase">amount</span>
            <span className="text-xl font-black text-white">₹{order.total_amount}</span>
          </div>

          <ChevronDown className={`text-white/20 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-8 pb-8"
          >
            <div className="pt-6 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Items List */}
              <div className="space-y-4">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">items included</p>
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-xs font-black">{item.product_name}</p>
                      <p className="text-[10px] font-bold text-white/20 uppercase">qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-black text-white/60">₹{item.unit_price * item.quantity}</p>
                  </div>
                ))}
              </div>

              {/* Delivery info */}
              <div className="bg-white/5 rounded-[2rem] p-6 space-y-4">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">delivery details</p>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase mb-1">address</p>
                  <p className="text-xs font-bold text-white/80 leading-relaxed">{order.delivery_address || 'n/a'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase mb-1">contact</p>
                  <p className="text-xs font-bold text-white/80 leading-relaxed">{order.profiles?.phone_number || 'no phone linked'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderHistoryPage;