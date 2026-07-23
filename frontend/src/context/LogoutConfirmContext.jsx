import { createContext, useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ConfirmModal from "../components/ui/ConfirmModal";

const LogoutConfirmContext = createContext(null);

export function LogoutConfirmProvider({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestLogout = useCallback(() => setIsOpen(true), []);
  const cancelLogout = useCallback(() => setIsOpen(false), []);

  const confirmLogout = useCallback(async () => {
    try {
      setLoading(true);
      await logout();
      setIsOpen(false);
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  return (
    <LogoutConfirmContext.Provider value={{ requestLogout }}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        title="Log out?"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        confirmVariant="danger"
        loading={loading}
      />
    </LogoutConfirmContext.Provider>
  );
}

export function useLogoutConfirm() {
  const context = useContext(LogoutConfirmContext);
  if (!context) {
    throw new Error("useLogoutConfirm must be used within LogoutConfirmProvider");
  }
  return context;
}
