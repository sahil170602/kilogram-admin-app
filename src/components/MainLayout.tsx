import { useState } from "react";
import { 
  Home, Layers, LayoutGrid, Package, Users, 
  History, Store, Menu, X, ShoppingBag, LogOut,
  Megaphone // 🎯 Added Megaphone for the new notifications tab
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MainLayout = ({ children, activeNav, setActiveNav }: any) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'dashboard', icon: <Home size={18}/> },
    { id: 'sections', label: 'sections', icon: <Layers size={18}/> },
    { id: 'categories', label: 'categories', icon: <LayoutGrid size={18}/> },
    { id: 'products', label: 'products', icon: <Package size={18}/> },
    { id: 'users', label: 'user info', icon: <Users size={18}/> },
    { id: 'history', label: 'order history', icon: <History size={18}/> },
    // 🎯 NEW: Broadcasts / Notifications Tab
    { id: 'notifications', label: 'broadcasts', icon: <Megaphone size={18}/> },
    { id: 'settings', label: 'store setting', icon: <Store size={18}/> },
  ];

  const handleLogout = () => {
    if (confirm("are you sure you want to logout?")) {
      localStorage.removeItem("kilo_admin_authenticated");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex font-sans overflow-hidden">
      
      {/* MOBILE HAMBURGER */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-[100] w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md"
      >
        <Menu size={24} />
      </button>

      {/* PERSISTENT SIDEBAR */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth > 1024) && (
          <>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140] lg:hidden"
              />
            )}

            <motion.nav 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0c0c0f] border-r border-white/5 z-[150] flex flex-col p-6 shrink-0"
            >
              {/* LOGO SECTION - Reduced bottom margin */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-black shadow-lg">
                    <ShoppingBag size={18} />
                  </div>
                  <h1 className="text-lg font-black tracking-tighter">kilo admin</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/20 hover:text-white transition-colors"><X size={20}/></button>
              </div>

              {/* NAV ITEMS - Reduced padding and spacing */}
              <div className="flex-1 space-y-1">
                {navItems.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveNav(item.id); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                      activeNav === item.id ? "bg-primary text-black shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className={activeNav === item.id ? "" : "group-hover:text-primary transition-colors"}>
                      {item.icon}
                    </span>
                    <span className="text-md font-black tracking-tight ">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* LOGOUT & PROFILE SECTION - Compact layout */}
              <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all group"
                >
                  <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-xs font-black tracking-tight uppercase">logout</span>
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar p-6 md:p-10 lg:p-12 pt-24 lg:pt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainLayout;