import { createContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/auth.api";
import { storage } from "../utils/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function bootstrap() {
    try {
      if (!storage.getAccessToken()) {
        setLoading(false);
        return;
      }
      const res = await authApi.me();
      setUser(res.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        storage.clear();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(payload) {
        const res = await authApi.login(payload);
        storage.setAccessToken(res.data.accessToken);
        const me = await authApi.me();
        setUser(me.data);
        return me;
      },
      async register(payload) {
        return authApi.register(payload);
      },
      async logout() {
        try {
          await authApi.logout();
        } finally {
          storage.clear();
          setUser(null);
        }
      },
      async refreshUser() {
        try {
          const res = await authApi.me();
          setUser(res.data);
          return res.data;
        } catch (err) {
          const status = err?.response?.status;
          if (status === 401) {
            storage.clear();
            setUser(null);
          }
          throw err;
        }
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
