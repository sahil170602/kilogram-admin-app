import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Bell, Send, CheckCircle2, Loader2, Megaphone } from "lucide-react";
import { motion } from "framer-motion";

const NotificationsPage = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("offer");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleSend = async () => {
    if (!title || !message) return alert("Title and Message are required");
    setLoading(true);

    const { error } = await supabase.from('notifications').insert([{ title, message, type }]);
    
    setLoading(false);
    if (error) {
      alert("Failed to send: " + error.message);
    } else {
      setSuccess(true);
      setTitle("");
      setMessage("");
      fetchHistory();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="lowercase pb-20">
      <header className="mb-10">
        <h2 className="text-3xl font-black tracking-tighter mb-2 italic flex items-center gap-3">
          <Megaphone className="text-primary" size={28} /> Broadcast <span className="text-primary">Center</span>
        </h2>
        <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em]">Send live alerts to all users</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Composer */}
        <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem]">
          <h3 className="text-sm font-black uppercase text-white/40 tracking-widest mb-6">Compose Message</h3>
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 ml-4">Notification Type</label>
              <div className="flex gap-2 mt-2">
                {['offer', 'alert', 'info'].map(t => (
                  <button 
                    key={t} onClick={() => setType(t)} 
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${type === t ? 'bg-primary border-primary text-black' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-white/40 ml-4">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Flash Sale Live!" className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary transition-colors" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-white/40 ml-4">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your broadcast message here..." className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary transition-colors h-32 resize-none" />
            </div>

            <button onClick={handleSend} disabled={loading} className="w-full h-14 mt-4 bg-primary text-black rounded-2xl font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-2 hover:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,153,193,0.2)] disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Send size={18} />}
              {success ? "Sent Successfully" : "Broadcast Now"}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem] flex flex-col max-h-[600px]">
          <h3 className="text-sm font-black uppercase text-white/40 tracking-widest mb-6 flex items-center justify-between">
            Recent Broadcasts
            <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[10px]">{history.length}</span>
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20">
                <Bell size={48} className="mb-4 opacity-50" />
                <p className="text-[10px] font-black uppercase tracking-widest">No history found</p>
              </div>
            ) : history.map(item => (
              <div key={item.id} className="p-5 bg-white/5 border border-white/5 rounded-[1.5rem] flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'offer' ? 'bg-orange-500/20 text-orange-400' : item.type === 'alert' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  <Bell size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-sm">{item.title}</h4>
                    <span className="text-[8px] font-black uppercase bg-white/10 px-2 py-0.5 rounded-md text-white/40">{item.type}</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed mb-2">{item.message}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                    {new Date(item.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;