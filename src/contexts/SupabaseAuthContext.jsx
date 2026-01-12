import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    setLoading(false);
  }, []);

  // Helper to handle auth errors uniformly
  const handleAuthError = useCallback((error, action) => {
    console.error(`Error during ${action}:`, error);
    
    let title = "Error";
    let description = error.message || "Ha ocurrido un error inesperado.";

    // Check for network errors
    if (error.message === "Failed to fetch" || error.status === 0) {
      title = "Error de conexión";
      description = "No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.";
    } else if (error.status === 400) {
      title = "Datos inválidos";
    } else if (error.status === 422) {
      title = "Error de validación";
    }

    toast({
      variant: "destructive",
      title,
      description,
    });
  }, [toast]);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          const isRefreshError = error.message && (
            error.message.includes("Invalid Refresh Token") || 
            error.message.includes("refresh_token_not_found")
          );

          if (isRefreshError) {
             console.warn("Refresh token invalid, forcing sign out to clear state.");
             await supabase.auth.signOut().catch(() => {});
             if (mounted) handleSession(null);
             return;
          }
          
          console.error("Error getting session:", error.message);
        }
        
        if (mounted) handleSession(session);
      } catch (e) {
        console.error("Unexpected error getting session", e);
        if (mounted) handleSession(null);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          handleSession(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          handleSession(session);
        } else if (session) {
          handleSession(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      handleAuthError(error, 'sign up');
      return { data: null, error };
    }
  }, [handleAuthError]);

  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      handleAuthError(error, 'sign in');
      return { data: null, error };
    }
  }, [handleAuthError]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error.message);
      handleAuthError(error, 'sign out');
    } finally {
      handleSession(null);
    }
  }, [handleSession, handleAuthError]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};