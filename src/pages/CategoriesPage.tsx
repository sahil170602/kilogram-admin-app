import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  LayoutGrid, Plus, Trash2, Edit3, 
  Upload, X, Loader2, ChevronDown 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();

    // Realtime subscription for categories
    const channel = supabase
      .channel("categories-realtime")
      .on("postgres_changes", { event: "*", table: "categories" }, () => {
        fetchInitialData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInitialData = async () => {
    const [cats, secs] = await Promise.all([
      supabase.from('categories').select('*, sections(title)').order('created_at', { ascending: false }),
      supabase.from('sections').select('id, title').order('order_index', { ascending: true })
    ]);
    
    if (cats.data) setCategories(cats.data);
    if (secs.data) setSections(secs.data);
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('category-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type // Add this line
    });
  
  if (error) throw error;
  
  const { data: publicUrl } = supabase.storage.from('category-images').getPublicUrl(data.path);
  return publicUrl.publicUrl;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedSectionId) {
      alert("please enter a name and select a section");
      return;
    }
    
    setIsSubmitting(true);

    try {
      let imageUrl = imagePreview; // Default to existing preview (holds URL if editing)

      // Only upload if a NEW file was picked
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: name.toLowerCase().trim(),
        image_url: imageUrl,
        section_id: parseInt(selectedSectionId)
      };

      if (editingId) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
      }

      resetForm();
      fetchInitialData();
    } catch (error: any) {
      console.error("error submitting category:", error);
      alert(error.message || "failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedSectionId("");
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    // Reset file input if necessary (optional)
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSelectedSectionId(cat.section_id.toString());
    setImagePreview(cat.image_url);
    setImageFile(null); // Clear any pending file uploads
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("are you sure? deleting this category will remove it from the user app.")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchInitialData();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 lowercase">
      
      {/* FORM SECTION */}
      <section className="w-full lg:w-96 shrink-0">
        <div className={`sticky top-10 border rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 ${editingId ? 'bg-primary/5 border-primary/20' : 'bg-white/[0.02] border-white/10'}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black tracking-tighter flex items-center gap-3">
              {editingId ? <Edit3 size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
              {editingId ? 'edit category' : 'new category'}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-white/20 hover:text-white transition-colors">
                <X size={18} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 px-2 tracking-widest">category image</label>
              <div className="relative aspect-square w-full rounded-3xl bg-white/5 border border-dashed border-white/10 overflow-hidden group">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                      <label className="cursor-pointer p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/10">
                        <Upload size={24} />
                        <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer gap-2 hover:bg-white/[0.02] transition-colors">
                    <Upload size={32} className="text-white/10" />
                    <span className="text-[10px] font-black uppercase text-white/20 tracking-tighter">upload local image</span>
                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 px-2 tracking-widest">category name</label>
              <input 
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. fresh fruits"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary transition-all placeholder:text-white/5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 px-2 tracking-widest">link to section</label>
              <div className="relative">
                <select 
                  value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none appearance-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="" className="bg-[#0c0c0f]">select a section</option>
                  {sections.map(s => <option key={s.id} value={s.id} className="bg-[#0c0c0f]">{s.title}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
              </div>
            </div>

            <button 
              disabled={isSubmitting || !name.trim() || !selectedSectionId}
              className={`w-full py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all disabled:opacity-30 disabled:grayscale ${editingId ? 'bg-white text-black' : 'bg-primary text-black'}`}
            >
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : (editingId ? "update category" : "create category")}
            </button>
          </form>
        </div>
      </section>

      {/* LIST SECTION */}
      <section className="flex-1">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <LayoutGrid size={24} className="text-primary" />
            <h2 className="text-2xl font-black tracking-tighter">active categories</h2>
          </div>
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">total: {categories.length}</span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-white/10 italic animate-pulse">syncing categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {categories.map((cat) => (
                <motion.div 
                  layout key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white/[0.02] border border-white/10 rounded-[2rem] p-4 flex items-center justify-between group transition-all hover:bg-white/[0.04] ${editingId === cat.id ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-black/40 overflow-hidden border border-white/5 shadow-inner">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/5 italic text-[8px]">no image</div>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-tighter mb-0.5">{cat.sections?.title || 'unlinked'}</p>
                      <h4 className="text-sm font-black text-white/90 truncate max-w-[120px]">{cat.name}</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(cat)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/20 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!loading && categories.length === 0 && (
              <div className="col-span-full h-64 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-white/10">
                <LayoutGrid size={40} className="mb-4" />
                <p className="font-black uppercase text-[10px] tracking-widest">no categories found</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoriesPage;