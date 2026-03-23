import { useState, useEffect } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import PinOverlay from "./components/PinOverlay"; // Make sure to create this component file

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
    <>
      {isUnlocked ? (
        <AdminDashboard onLogout={handleLock} />
      ) : (
        <PinOverlay onUnlocked={handleUnlock} />
      )}
    </>
  );
}

export default App;