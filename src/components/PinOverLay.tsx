import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Lock, Delete, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PinOverlay = ({ onUnlocked }: { onUnlocked: () => void }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  useEffect(() => {
    if (pin.length === 4) {
      verifyPin();
    }
  }, [pin]);

  const verifyPin = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('admin_config')
      .select('pin_hash')
      .eq('id', 'master_pin')
      .single();

    if (data && data.pin_hash === pin) {
      // Success! Save session to local storage so it stays unlocked
      localStorage.setItem("kilo_admin_auth", "true");
      onUnlocked();
    } else {
      setError(true);
      setPin(""); // Reset on wrong pin
      // Vibrate if on mobile
      if (navigator.vibrate) navigator.vibrate(200);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#08080a] z-[1000] flex flex-col items-center justify-center p-6 lowercase">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock className={error ? "text-red-500 animate-bounce" : "text-primary"} size={24} />
        </div>
        <h2 className="text-2xl font-black tracking-tighter">kilo secure</h2>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-2">
          {error ? "incorrect pin" : "enter admin pin"}
        </p>
      </motion.div>

      {/* PIN INDICATORS */}
      <div className="flex gap-4 mb-16">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              pin.length > i ? "bg-primary border-primary shadow-[0_0_15px_rgba(255,153,193,0.5)]" : "border-white/10"
            }`}
          />
        ))}
      </div>

      {/* NUMPAD */}
      <div className="grid grid-cols-3 gap-6 max-w-[280px]">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <button
            key={num} onClick={() => handlePress(num)}
            className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 text-xl font-black hover:bg-white/10 active:scale-90 transition-all"
          >
            {num}
          </button>
        ))}
        <button onClick={handleDelete} className="w-16 h-16 flex items-center justify-center text-white/20 hover:text-white transition-colors">
          <Delete size={20} />
        </button>
        <button onClick={() => handlePress("0")} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 text-xl font-black hover:bg-white/10 active:scale-90 transition-all">0</button>
        <div className="w-16 h-16 flex items-center justify-center">
            {loading && <Loader2 className="animate-spin text-primary" size={20} />}
        </div>
      </div>
    </div>
  );
};

export default PinOverlay;