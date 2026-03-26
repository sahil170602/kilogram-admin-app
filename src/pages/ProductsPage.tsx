import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  Package, Plus, Trash2, Edit3, Upload, 
  Loader2, ChevronDown, ShoppingBag, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🎯 Added 'rating' to initial state
  const [formData, setFormData] = useState({
    name: "", price: "", mrp: "", brand: "", shelf_life: "",
    origin: "", product_type: "", contents: "", material_type: "",
    section_id: "", category_id: "", is_veg: true,
    variant: "", allergen_info: "", key_features: "", 
    ingredients: "", calorie_count: "", item_included: "",
    stock_status: "in_stock", rating: ""
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (formData.section_id) {
      const filtered = categories.filter(c => c.section_id?.toString() === formData.section_id.toString());
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [formData.section_id, categories]);

  const fetchInitialData = async () => {
    const [prodRes, secRes, catRes] = await Promise.all([
      supabase.from('products').select('*, categories(name), sections(title)').order('created_at', { ascending: false }),
      supabase.from('sections').select('*').order('order_index', { ascending: true }),
      supabase.from('categories').select('*').order('name', { ascending: true })
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (secRes.data) setSections(secRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalImageUrl = imagePreview;
      if (imageFile) finalImageUrl = await uploadImage(imageFile);

      // 🎯 Ensure rating is formatted properly before sending to database
      const cleanPayload = {
        ...formData,
        rating: formData.rating ? Number(formData.rating) : null,
        image_url: finalImageUrl
      };
      
      if (editingId) {
        const { error } = await supabase.from('products').update(cleanPayload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([cleanPayload]);
        if (error) throw error;
      }
      resetForm();
      fetchInitialData();
    } catch (err: any) { alert(err.message); }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    // 🎯 Clear rating on reset
    setFormData({
      name: "", price: "", mrp: "", brand: "", shelf_life: "",
      origin: "", product_type: "", contents: "", material_type: "",
      section_id: "", category_id: "", is_veg: true,
      variant: "", allergen_info: "", key_features: "", 
      ingredients: "", calorie_count: "", item_included: "",
      stock_status: "in_stock", rating: ""
    });
    setImageFile(null); setImagePreview(null); setEditingId(null);
  };

  const toggleStock = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'in_stock' ? 'out_of_stock' : 'in_stock';
    await supabase.from('products').update({ stock_status: newStatus }).eq('id', id);
    fetchInitialData();
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    // 🎯 Populate rating when editing
    setFormData({
      name: p.name || "", price: p.price || "", mrp: p.mrp || "", brand: p.brand || "",
      shelf_life: p.shelf_life || "", origin: p.origin || "", product_type: p.product_type || "",
      contents: p.contents || "", material_type: p.material_type || "",
      section_id: p.section_id?.toString() || "", category_id: p.category_id?.toString() || "",
      is_veg: p.is_veg ?? true, variant: p.variant || "", allergen_info: p.allergen_info || "",
      key_features: p.key_features || "", ingredients: p.ingredients || "",
      calorie_count: p.calorie_count || "", item_included: p.item_included || "",
      stock_status: p.stock_status || "in_stock", rating: p.rating?.toString() || ""
    });
    setImagePreview(p.image_url);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <div className="flex flex-col xl:flex-row gap-10 lowercase">
      {/* FORM: FULL HIGHLIGHTS OPTIONS */}
      <section className="w-full xl:w-[500px] shrink-0">
        <div className={`sticky top-10 border rounded-[3rem] p-8 shadow-2xl transition-all ${editingId ? 'bg-primary/5 border-primary/20' : 'bg-white/[0.02] border-white/10'}`}>
          <h3 className="text-xl font-black mb-8 flex items-center gap-3">
            <Package className="text-primary" /> {editingId ? 'edit inventory' : 'add new item'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Preview */}
            <div className="flex gap-4 items-center bg-white/5 p-4 rounded-[2rem] border border-white/5">
                <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 overflow-hidden shrink-0">
                    {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-white/10 italic">no img</div>}
                </div>
                <label className="flex-1 cursor-pointer py-3 bg-white/5 rounded-xl text-center text-[10px] font-black uppercase hover:bg-white/10 transition-all">
                    upload product photo
                    <input type="file" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                    }} />
                </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="product name" value={formData.name} onChange={(v: any) => setFormData({...formData, name: v})} />
                <Input label="brand" value={formData.brand} onChange={(v: any) => setFormData({...formData, brand: v})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Select label="section" value={formData.section_id} options={sections} onChange={(v: any) => setFormData({...formData, section_id: v, category_id: ""})} />
                <Select label="category" value={formData.category_id} options={filteredCategories} onChange={(v: any) => setFormData({...formData, category_id: v})} displayKey="name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="variant" placeholder="e.g. traditional" value={formData.variant} onChange={(v: any) => setFormData({...formData, variant: v})} />
                <Input label="calorie count" placeholder="e.g. 484.6 kcal" value={formData.calorie_count} onChange={(v: any) => setFormData({...formData, calorie_count: v})} />
            </div>

            {/* 🎯 Added Rating Field here */}
            <div className="grid grid-cols-2 gap-4">
                <Input label="rating (0-5)" type="number" step="0.1" min="0" max="5" placeholder="e.g. 4.8" value={formData.rating} onChange={(v: any) => setFormData({...formData, rating: v})} />
                <Input label="items included" value={formData.item_included} onChange={(v: any) => setFormData({...formData, item_included: v})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="sale price (₹)" type="number" value={formData.price} onChange={(v: any) => setFormData({...formData, price: v})} />
                <Input label="mrp (₹)" type="number" value={formData.mrp} onChange={(v: any) => setFormData({...formData, mrp: v})} />
            </div>

            <Area label="ingredients" placeholder="rice flour, rice bran oil..." value={formData.ingredients} onChange={(v: any) => setFormData({...formData, ingredients: v})} />
            <Area label="key features" placeholder="traditional style, zero trans fats..." value={formData.key_features} onChange={(v: any) => setFormData({...formData, key_features: v})} />
            <Input label="allergen info" placeholder="contains wheat..." value={formData.allergen_info} onChange={(v: any) => setFormData({...formData, allergen_info: v})} />

            <div className="grid grid-cols-2 gap-4">
                <Input label="shelf life" value={formData.shelf_life} onChange={(v: any) => setFormData({...formData, shelf_life: v})} />
                <Input label="weight/contents" value={formData.contents} onChange={(v: any) => setFormData({...formData, contents: v})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="product type" value={formData.product_type} onChange={(v: any) => setFormData({...formData, product_type: v})} />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 px-2 tracking-widest">dietary preference</label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    <button type="button" onClick={() => setFormData({...formData, is_veg: true})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${formData.is_veg ? "bg-green-500 text-white shadow-lg" : "text-white/20"}`}>veg</button>
                    <button type="button" onClick={() => setFormData({...formData, is_veg: false})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!formData.is_veg ? "bg-red-500 text-white shadow-lg" : "text-white/20"}`}>non-veg</button>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
              {editingId && <button type="button" onClick={resetForm} className="flex-1 py-5 bg-white/5 text-white/40 rounded-3xl font-black uppercase text-xs hover:text-white transition-all">cancel</button>}
              <button disabled={isSubmitting} className={`flex-[2] py-5 rounded-3xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all ${editingId ? 'bg-white text-black' : 'bg-primary text-black'}`}>
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : (editingId ? "update inventory" : "add item")}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* RIGHT: INVENTORY LIST WITH STOCK CONTROL */}
      <section className="flex-1 space-y-6">
        <header className="flex justify-between items-center px-4">
            <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3"><ShoppingBag className="text-primary"/> live inventory</h2>
            <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">total skus: {products.length}</div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
            {products.map(p => (
                <div key={p.id} className={`bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 group transition-all flex gap-6 ${editingId === p.id ? 'border-primary ring-1 ring-primary/20' : 'hover:border-primary/30'} ${p.stock_status === 'out_of_stock' ? 'opacity-50 grayscale' : ''}`}>
                    <div className="w-20 h-20 rounded-3xl bg-black/40 border border-white/5 overflow-hidden shrink-0">
                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center italic text-[8px] text-white/5">no img</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-primary uppercase mb-1 truncate">{p.categories?.name} • {p.brand}</p>
                        <h4 className="text-lg font-black truncate">{p.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-xl font-black text-white">₹{p.price}</span>
                            <span className="text-xs text-white/20 line-through font-bold">₹{p.mrp}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleStock(p.id, p.stock_status)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${p.stock_status === 'in_stock' ? 'bg-white/5 text-green-400 hover:text-white' : 'bg-red-500/10 text-red-500'}`}>
                          {p.stock_status === 'in_stock' ? <Eye size={16}/> : <EyeOff size={16}/>}
                        </button>
                        <button onClick={() => handleEdit(p)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white"><Edit3 size={16}/></button>
                        <button onClick={async () => { if(confirm('remove?')) { await supabase.from('products').delete().eq('id', p.id); fetchInitialData(); }}} className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500/40 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
};

// HELPER COMPONENTS
const Input = ({ label, value, onChange, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-white/20 px-2 tracking-widest">{label}</label>
    <input 
      {...props} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary transition-all text-white placeholder:text-white/5" 
    />
  </div>
);

const Area = ({ label, value, onChange, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-white/20 px-2 tracking-widest">{label}</label>
    <textarea 
      {...props} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary transition-all text-white placeholder:text-white/5 min-h-[80px]" 
    />
  </div>
);

const Select = ({ label, value, options, onChange, displayKey = "title", ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-white/20 px-2 tracking-widest">{label}</label>
    <div className="relative">
        <select 
          {...props} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none appearance-none focus:border-primary transition-all text-white cursor-pointer"
        >
            <option value="" className="bg-[#0c0c0f]">select...</option>
            {options.map((o: any) => <option key={o.id} value={o.id} className="bg-[#0c0c0f]">{o[displayKey]}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
    </div>
  </div>
);

export default ProductsPage;
