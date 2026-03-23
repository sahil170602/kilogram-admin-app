import { useState, useEffect } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import PinOverlay from "./components/PinOverLay"; // 🎯 Matches your filename lowercase

function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the dashboard was already unlocked in this browser session
    const authStatus = localStorage.getItem("kilo_admin_authenticated");
    if (authStatus === "true") {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  }, []);

  const handleUnlock = () => {
    localStorage.setItem("kilo_admin_authenticated", "true");
    setIsUnlocked(true);
  };

  const handleLock = () => {
    localStorage.removeItem("kilo_admin_authenticated");
    setIsUnlocked(false);
  };

  // Prevent flicker while checking localStorage
  if (isUnlocked === null) return null;

  return (
    <div className="min-h-screen bg-[#08080a] text-white selection:bg-primary/30">
      {isUnlocked ? (
        <AdminDashboard onLogout={handleLock} />
      ) : (
        <PinOverlay onUnlocked={handleUnlock} />
      )}
    </div>
  );
}

export default App;