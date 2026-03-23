import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Layers, Plus, Trash2, MoveVertical, Loader2, Edit3, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SectionsPage = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchSections();

    const channel = supabase
      .channel("realtime-sections")
      .on("postgres_changes", { event: "*", table: "sections" }, () => {
        fetchSections();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) console.error("Error:", error);
    if (data) setSections(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const slug = title.toLowerCase().replace(/ /g, "-");
    const payload = { 
        title: title.trim().toLowerCase(), 
        subtitle: subtitle.trim().toLowerCase(),
        slug: slug
    };

    if (editingId) {
      // UPDATE EXISTING
      const { error } = await supabase.from("sections").update(payload).eq("id", editingId);
      if (!error) cancelEdit();
      else alert(error.message);
    } else {
      // CREATE NEW
      const { error } = await supabase.from("sections").insert([{ ...payload, order_index: sections.length + 1 }]);
      if (!error) { setTitle(""); setSubtitle(""); }
      else alert(error.message);
    }
    setIsSubmitting(false);
  };

  const startEdit = (sec: any) => {
    setEditingId(sec.id);
    setTitle(sec.title);
    setSubtitle(sec.subtitle || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("are you sure? this will remove the section permanently.")) return;
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) alert(error.message);
    if (editingId === id) cancelEdit();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 lowercase">
      
      {/* FORM PANEL */}
      <section className="w-full lg:w-80 shrink-0">
        <div className={`sticky top-10 border rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 ${editingId ? 'bg-primary/5 border-primary/30' : 'bg-white/[0.02] border-white/10'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black tracking-tighter flex items-center gap-3">
              {editingId ? <Edit3 size={20} className="text-primary" /> : <Layers size={20} className="text-primary" />}
              {editingId ? 'edit section' : 'new section'}
            </h3>
            {editingId && (
              <button onClick={cancelEdit} className="text-white/20 hover:text-white transition-colors">
                <X size={18} />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 px-2 tracking-widest">display title</label>
              <input 
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. bulk savings"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 px-2 tracking-widest">subtitle</label>
              <input 
                type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. save more on monthly rations"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            <button 
              disabled={isSubmitting || !title} 
              className={`w-full py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all disabled:opacity-30 ${editingId ? 'bg-white text-black' : 'bg-primary text-black'}`}
            >
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : (editingId ? "update section" : "save to database")}
            </button>
          </form>
        </div>
      </section>

      {/* LIST PANEL */}
      <section className="flex-1">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-4">
            <Layers size={24} className="text-primary" />
            <h2 className="text-2xl font-black tracking-tighter">live app sections</h2>
          </div>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">total: {sections.length}</p>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-white/10 italic animate-pulse">syncing...</div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sections.map((sec, index) => (
                <motion.div 
                  layout key={sec.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className={`border rounded-[2rem] p-6 flex items-center justify-between group transition-all ${editingId === sec.id ? 'bg-primary/10 border-primary' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="text-white/10 font-black text-2xl italic select-none group-hover:text-primary/20 transition-colors">0{index + 1}</div>
                    <div>
                      <h4 className="text-lg font-black text-white/90 first-letter:uppercase">{sec.title}</h4>
                      <p className="text-xs text-white/30 font-bold">{sec.subtitle || 'no subtitle provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(sec)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(sec.id)} className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/20">
                      <Trash2 size={16} />
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/10 cursor-grab active:cursor-grabbing">
                      <MoveVertical size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sections.length === 0 && (
               <div className="h-64 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-white/10">
                  <Layers size={40} className="mb-4" />
                  <p className="font-black uppercase text-[10px] tracking-widest">database is empty</p>
               </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default SectionsPage;