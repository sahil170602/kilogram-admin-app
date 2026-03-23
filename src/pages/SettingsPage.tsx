import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  Store, MapPin, Lock, Save, Navigation, 
  Clock, Loader2, Target, CheckCircle2, ExternalLink 
} from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [settings, setSettings] = useState({
    store_name: "",
    store_address: "",
    lat: 0,
    lng: 0
  });
  const [pinData, setPinData] = useState({ oldPin: "", newPin: "" });
  const [message, setMessage] = useState("");

  useEffect(() => { 
    fetchSettings(); 
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      setSettings({
        store_name: data.store_name || "",
        store_address: data.store_address || "",
        lat: data.lat || 0,
        lng: data.lng || 0
      });
    }
    if (error && error.code !== 'PGRST116') {
      console.error("error loading settings:", error.message);
    }
  };

  // 🎯 UPDATED: Detect Location with Google Maps Exact Match & Map Preview
  const detectLocation = () => {
    setLocLoading(true);
    if (!navigator.geolocation) {
      alert("geolocation is not supported by your browser");
      setLocLoading(false);
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true, // 🛰️ Forces GPS
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setSettings(prev => ({ ...prev, lat: latitude, lng: longitude }));
        
        try {
          // Replace 'YOUR_GOOGLE_MAPS_API_KEY' with your actual key for best accuracy
          const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; 
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
          );
          const data = await res.json();
          
          if (data.status === "OK" && data.results.length > 0) {
            setSettings(prev => ({ ...prev, store_address: data.results[0].formatted_address }));
          } else {
            // Fallback to OSM if Google is unavailable
            const resAlt = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            const dataAlt = await resAlt.json();
            setSettings(prev => ({ ...prev, store_address: dataAlt.display_name }));
          }
        } catch (e) { 
          console.error("geocoding error", e); 
        }
        
        setLocLoading(false);
        setMessage(`exact location detected (accuracy: ${accuracy.toFixed(0)}m)`);
        setTimeout(() => setMessage(""), 3000);
      },
      (error) => {
        alert("error detecting location: " + error.message);
        setLocLoading(false);
      },
      geoOptions
    );
  };

  const verifyOnMaps = () => {
    if (!settings.lat || !settings.lng) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${settings.lat},${settings.lng}`;
    window.open(url, '_blank');
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        id: 1,
        store_name: settings.store_name,
        store_address: settings.store_address,
        lat: settings.lat,
        lng: settings.lng,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      setMessage("all settings saved to database");
    } else {
      alert("database error: " + error.message);
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleChangePin = async () => {
    if (pinData.newPin.length !== 4) {
        alert("pin must be 4 digits");
        return;
    }
    setLoading(true);
    const { data: current } = await supabase.from('admin_config').select('pin_hash').eq('id', 'master_pin').single();
    if (current && current.pin_hash === pinData.oldPin) {
      const { error } = await supabase.from('admin_config').update({ pin_hash: pinData.newPin }).eq('id', 'master_pin');
      if (!error) {
        setMessage("security pin updated");
        setPinData({ oldPin: "", newPin: "" });
      }
    } else {
      alert("incorrect current pin");
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="lowercase pb-20 max-w-4xl">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Store className="text-primary" size={24} />
          <h2 className="text-3xl font-black tracking-tighter">store control</h2>
        </div>
        <p className="text-white/20 font-bold uppercase text-[10px] tracking-[0.4em]">permanent origin & security</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-primary">
              <Navigation size={18} />
              <h3 className="font-black text-sm uppercase tracking-widest">origin</h3>
            </div>
            <button 
              onClick={detectLocation}
              disabled={locLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase transition-all"
            >
              {locLoading ? <Loader2 size={12} className="animate-spin" /> : <Target size={12} />}
              detect
            </button>
          </div>

          {/* 🎯 MAP PREVIEW */}
          <div className="relative h-48 w-full bg-white/5 rounded-3xl overflow-hidden border border-white/10 group">
            {settings.lat !== 0 ? (
              <>
                <iframe
                  title="map-preview"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://maps.google.com/maps?q=${settings.lat},${settings.lng}&z=16&output=embed`}
                  className="grayscale invert opacity-80 contrast-125"
                />
                <button 
                  onClick={verifyOnMaps}
                  className="absolute bottom-4 right-4 p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl text-primary flex items-center gap-2 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  <ExternalLink size={14} /> full map
                </button>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-6">
                <MapPin size={32} className="mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">detect to load map</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Input label="shop name" value={settings.store_name} onChange={(v:any) => setSettings({...settings, store_name: v})} />
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase ml-2 tracking-widest">saved address</label>
              <textarea 
                value={settings.store_address}
                onChange={(e) => setSettings({...settings, store_address: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary h-32 resize-none text-white leading-relaxed"
                placeholder="click detect to find exact address..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-white/20 uppercase">lat</p>
                  <p className="text-xs font-black text-primary">{(settings.lat || 0).toFixed(6)}</p>
               </div>
               <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-white/20 uppercase">lng</p>
                  <p className="text-xs font-black text-primary">{(settings.lng || 0).toFixed(6)}</p>
               </div>
            </div>
          </div>

          <button onClick={handleSaveSettings} disabled={loading} className="w-full py-5 bg-primary text-black rounded-3xl font-black text-xs shadow-xl active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "save store profile"}
          </button>
        </section>

        <section className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-3 text-orange-400">
              <Lock size={18} />
              <h3 className="font-black text-sm uppercase tracking-widest">admin access</h3>
            </div>
            <div className="space-y-4">
              <input 
                type="password" placeholder="current pin" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-orange-400 text-white"
                value={pinData.oldPin} onChange={(e) => setPinData({...pinData, oldPin: e.target.value})}
              />
              <input 
                type="password" placeholder="new pin" maxLength={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-orange-400 text-white"
                value={pinData.newPin} onChange={(e) => setPinData({...pinData, newPin: e.target.value})}
              />
            </div>
            <button onClick={handleChangePin} disabled={loading} className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs hover:bg-orange-400 transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "change pin"}
            </button>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[2rem] p-6 flex items-start gap-4">
              <Clock size={20} className="text-blue-400 mt-1" />
              <p className="text-[10px] font-bold text-blue-200/50 uppercase leading-relaxed tracking-wider">
                origin locked: {(settings.lat || 0).toFixed(2)}, {(settings.lng || 0).toFixed(2)}.
              </p>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-4 rounded-full font-black text-[10px] uppercase flex items-center gap-3 shadow-2xl z-[500]"
          >
            <CheckCircle2 size={16} className="text-green-500" /> {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Input = ({ label, value, onChange, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-white/20 uppercase ml-2 tracking-widest">{label}</label>
    <input 
      {...props} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary text-white" 
    />
  </div>
);

export default SettingsPage;