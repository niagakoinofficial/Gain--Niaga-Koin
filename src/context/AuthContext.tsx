import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, testFirestoreConnection } from '../firebase';
import { initUserProfile } from '../services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isLoggingIn: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isFirebaseConnected: boolean;
  is2faVerified: boolean;
  verify2faSession: () => void;
  reset2faVerification: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isLoggingIn: false,
  loginWithGoogle: async () => {},
  logout: async () => {},
  isFirebaseConnected: false,
  is2faVerified: false,
  verify2faSession: () => {},
  reset2faVerification: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [is2faVerified, setIs2faVerified] = useState<boolean>(() => {
    // Check session storage to keep verified state during active browser session
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('gain_2fa_verified') === 'true';
    }
    return false;
  });

  const verify2faSession = () => {
    setIs2faVerified(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gain_2fa_verified', 'true');
    }
  };

  const reset2faVerification = () => {
    setIs2faVerified(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gain_2fa_verified');
    }
  };

  useEffect(() => {
    testFirestoreConnection()
      .then(() => setIsFirebaseConnected(true))
      .catch(() => setIsFirebaseConnected(false));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await initUserProfile(user);
        } catch (err) {
          console.error('Failed to initialize user in Firestore:', err);
        }
      } else {
        // When logged out, reset 2FA verification
        reset2faVerification();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const res = await signInWithGoogle();
      if (res && res.user) {
        reset2faVerification();
        await initUserProfile(res.user);
      }
    } catch (err: any) {
      // Ignore user cancellation popup closed without signing in
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.error('Login error:', err);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      reset2faVerification();
      await signOutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isLoggingIn,
        loginWithGoogle,
        logout,
        isFirebaseConnected,
        is2faVerified,
        verify2faSession,
        reset2faVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
