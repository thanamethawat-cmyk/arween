"use client";

/**
 * @deprecated LEGACY Firebase auth — ไม่ถูกห่อใน Providers แล้ว
 * UX หลักใช้ NextAuth + Prisma เท่านั้น ไฟล์นี้เก็บไว้เป็นต้นแบบสาธิตเก่า
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
  FIREBASE_CONFIG_MISSING_MESSAGE,
} from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firebaseReady: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
});

function assertFirebaseReady() {
  if (!isFirebaseConfigured()) {
    throw new Error(FIREBASE_CONFIG_MISSING_MESSAGE);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              displayName:
                currentUser.displayName ||
                currentUser.email?.split("@")[0] ||
                "User",
              email: currentUser.email,
              photoURL: currentUser.photoURL || null,
              totalMeritScore: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.error("Failed to sync user doc in Firestore:", err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  const signInWithGoogle = async () => {
    assertFirebaseReady();
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    assertFirebaseReady();
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName?: string
  ) => {
    assertFirebaseReady();
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      const userRef = doc(db, "users", res.user.uid);
      await setDoc(userRef, {
        uid: res.user.uid,
        displayName: displayName || email.split("@")[0],
        email: res.user.email,
        photoURL: null,
        totalMeritScore: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const logout = async () => {
    assertFirebaseReady();
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        firebaseReady,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
