/**
 * Phase 4 - Auth Hook for Frontend
 *
 * Provides Supabase authentication state and token management.
 * Integrates with tRPC for authenticated API calls.
 *
 * @module client/hooks/useAuth
 * @version 1.0.0
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

// =============================================================================
// SUPABASE CLIENT (Browser-side)
// =============================================================================

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[useAuth] Missing Supabase environment variables');
}

// Create browser-side Supabase client
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// =============================================================================
// TYPES
// =============================================================================

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Get the current access token (for tRPC headers) */
  getAccessToken: () => string | null;
  /** Sign in with email/password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign up with email/password */
  signUp: (email: string, password: string) => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Get or create system user for demo mode */
  ensureSystemUser: () => Promise<string>;
}

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthState | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemUserId, setSystemUserId] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      console.warn('[useAuth] Supabase client not initialized, using demo mode');
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Get access token for API calls
  const getAccessToken = useCallback((): string | null => {
    // If authenticated via Supabase, use the access token
    if (session?.access_token) {
      return session.access_token;
    }

    // If we have a system user ID (demo mode), use that
    if (systemUserId) {
      return systemUserId;
    }

    // Try to get from localStorage (demo mode persistence)
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('demo_user_id');
      if (storedUserId) {
        return storedUserId;
      }
    }

    return null;
  }, [session, systemUserId]);

  // Ensure system user exists (for demo mode without full auth)
  const ensureSystemUser = useCallback(async (): Promise<string> => {
    // Check if already have a user ID
    const existingId = getAccessToken();
    if (existingId) {
      return existingId;
    }

    // Check localStorage first
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('demo_user_id');
      if (storedUserId) {
        setSystemUserId(storedUserId);
        return storedUserId;
      }
    }

    // For demo mode, fetch the system user ID from the backend
    try {
      const response = await fetch('/api/trpc/vision.getSystemUser?batch=1&input={}', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // tRPC batch response format
        const userId = data?.[0]?.result?.data?.userId;
        if (userId) {
          setSystemUserId(userId);
          if (typeof window !== 'undefined') {
            localStorage.setItem('demo_user_id', userId);
          }
          console.log('[useAuth] Got system user ID:', userId);
          return userId;
        }
      }
    } catch (error) {
      console.error('[useAuth] Failed to get system user:', error);
    }

    // Fallback: Generate a temporary ID (won't persist across sessions properly)
    console.warn('[useAuth] Using fallback temporary ID');
    const tempId = crypto.randomUUID();
    setSystemUserId(tempId);
    return tempId;
  }, [getAccessToken]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  // Sign up
  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSystemUserId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_user_id');
    }
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    session,
    isLoading,
    isAuthenticated: !!user || !!systemUserId,
    getAccessToken,
    signIn,
    signUp,
    signOut,
    ensureSystemUser,
  }), [user, session, isLoading, systemUserId, getAccessToken, signIn, signUp, signOut, ensureSystemUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useAuth(): AuthState {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// =============================================================================
// TOKEN GETTER (for tRPC)
// =============================================================================

// Singleton reference for the token getter
let tokenGetterRef: (() => string | null) | null = null;

export function setTokenGetter(getter: () => string | null) {
  tokenGetterRef = getter;
}

export function getAuthToken(): string | null {
  return tokenGetterRef?.() ?? null;
}

export default useAuth;
