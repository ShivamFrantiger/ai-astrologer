
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import type { Subscription } from '@/app/types/subscription';

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// List of routes that are accessible to non-authenticated users
const publicRoutes = ['/login', '/signup', '/verify-email'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // User is signed in.
        const isVerified = user.emailVerified || user.providerData.some(p => p.providerId === 'google.com');

        if (isVerified) {
          setUser(user);

          // Fetch subscription
          const subRef = doc(db, 'subscriptions', user.uid);
          const subDoc = await getDoc(subRef);
          if (subDoc.exists()) {
            setSubscription(subDoc.data() as Subscription);
          } else {
            setSubscription(null);
          }

          if (pathname === '/login' || pathname === '/signup' || pathname === '/verify-email') {
            router.push('/');
          }
        } else {
          // User signed up with email but is not verified.
          setUser(null);
          setSubscription(null);
          if (pathname !== '/verify-email') {
            router.push('/verify-email');
          }
        }
      } else {
        // User is signed out.
        setUser(null);
        setSubscription(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // We include router and pathname to re-evaluate logic on navigation changes
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ user, subscription, loading }}>
      {loading ? (
         <div className="flex h-screen items-center justify-center bg-[#0D0D0D]">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-[#FFC249] border-t-transparent"></div>
         </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
