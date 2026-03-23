import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  Users, Search, Calendar, Phone, Mail, 
  ShoppingBag, Shield, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_analytics')
      .select('*')
      .order('joined_at', { ascending: false });

    if (error) console.error("fetch error:", error);
    if (data) setUsers(data);
    setLoading(false);
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone_number?.includes(searchQuery) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="lowercase">
      {/* HEADER */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-primary" size={24} />
            <h2 className="text-3xl font-black tracking-tighter">customer base</h2>
          </div>
          <p className="text-white/20 font-bold uppercase text-[10px] tracking-[0.4em]">registered user directory</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text"
            placeholder="search name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-primary transition-all text-white"
          />
        </div>
      </header>

      {/* TABLE */}
      <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="p-6 text-[10px] font-black uppercase text-white/20 tracking-widest">idx</th>
                <th className="p-6 text-[10px] font-black uppercase text-white/20 tracking-widest">customer</th>
                <th className="p-6 text-[10px] font-black uppercase text-white/20 tracking-widest">contact info</th>
                <th className="p-6 text-[10px] font-black uppercase text-white/20 tracking-widest text-center">orders</th>
                <th className="p-6 text-[10px] font-black uppercase text-white/20 tracking-widest text-center">spent</th>
                <th className="p-6 text-[10px] font-black uppercase text-white/20 tracking-widest">joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center italic text-white/10 animate-pulse">syncing user data...</td>
                </tr>
              ) : filteredUsers.map((user, index) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6 font-black text-white/10 italic">#{(index + 1).toString().padStart(2, '0')}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20">
                        {user.full_name?.charAt(0) || 'u'}
                      </div>
                      <div>
                        <span className="text-sm font-black text-white/90 block leading-none mb-1">{user.full_name || 'unnamed'}</span>
                        <div className="flex items-center gap-1 opacity-40">
                          <Shield size={8} />
                          <span className="text-[8px] font-black uppercase tracking-tighter">{user.role}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-white/50">
                        <Phone size={12} className="text-primary/40" /> {user.phone_number || 'no phone'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/20">
                        <Mail size={10} /> {user.email || 'no email'}
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-black border border-white/5">{user.total_orders}</span>
                  </td>
                  <td className="p-6 text-center font-black text-green-400">₹{user.total_spent}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/30">
                      <Calendar size={12} />
                      {new Date(user.joined_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;