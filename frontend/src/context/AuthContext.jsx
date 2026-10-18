import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rms_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current session on mount via /api/auth/me
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('rms_user', JSON.stringify(data.user));
        }
      } else {
        // If 401 or invalid session, clear user state
        setUser(null);
        localStorage.removeItem('rms_user');
      }
    } catch (err) {
      // In offline/mock preview mode, retain existing mock or local session
      console.warn('[AuthContext] Could not reach backend session endpoint, using offline state:', err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login using PRN/Email/Username + Password
   */
  const login = async ({ identifier, prn, email, password, role }) => {
    setAuthError(null);
    const loginPayload = {
      identifier: identifier || prn || email,
      prn,
      email,
      password,
      role,
    };

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginPayload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const message = data.message || 'Login failed. Please check your credentials.';
        setAuthError(message);
        return { success: false, message };
      }

      setUser(data.user);
      localStorage.setItem('rms_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      const message = 'Unable to connect to the authentication server. Ensure backend is running.';
      setAuthError(message);
      return { success: false, message };
    }
  };

  /**
   * Logout user and clear session cookie
   */
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[AuthContext] Logout fetch failed:', err.message);
    } finally {
      setUser(null);
      localStorage.removeItem('rms_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        authError,
        setAuthError,
        login,
        logout,
        checkCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
