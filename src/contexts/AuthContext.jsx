import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is now a mock, Supabase handles the real auth
    setLoading(false);
  }, []);

  const login = (email, password) => {
    console.warn("Mock login used. Supabase should handle this.");
    return { success: false, error: 'Auth not configured' };
  };

  const register = (name, email, password) => {
    console.warn("Mock register used. Supabase should handle this.");
    return { success: false, error: 'Auth not configured' };
  };

  const logout = () => {
    console.warn("Mock logout used. Supabase should handle this.");
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}