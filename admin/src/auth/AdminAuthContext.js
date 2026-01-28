import React, { createContext, useState, useContext, useEffect } from 'react';
import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { adminAuth, adminDB } from '../firebase.admin';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = adminAuth.onAuthStateChanged(async (user) => {
      if (user) {
        // Check if admin account exists
        const docRef = doc(adminDB, "admins", user.email);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const adminData = snap.data();
          const adminType = adminData.propertyType === 'Homestays' ? 'homestay' : 'hotel';
          localStorage.setItem('adminType', adminType);
          setUser({ ...user, adminType, role: adminData.role });
        } else {
          // Not an admin account - sign out
          await signOut(adminAuth);
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('adminType');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(adminAuth, provider);
    const user = result.user;

    // Check admin collection after Google sign in
    const docRef = doc(adminDB, "admins", user.email);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const adminData = snap.data();
      return adminData.propertyType;
    } else {
      await signOut(adminAuth);
      throw new Error("Admin account not found. Please register first.");
    }
  };

  const logout = async () => {
    try {
      await signOut(adminAuth);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('adminType');
      setUser(null);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
