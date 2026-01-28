import React, { createContext, useState, useContext, useEffect } from 'react';
import { adminAuth, adminDB } from '../firebase.admin';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (user) => {
      if (user) {
        const adminDoc = await getDoc(doc(adminDB, 'admins', user.email));
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          const adminType = data.propertyType === 'Homestays' ? 'homestay' : 'hotel';
          localStorage.setItem('adminType', adminType);
          setUser({ ...user, adminType });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (userId, adminType) => {
    // Store the admin type in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('adminType', adminType);
    setUser({ ...adminAuth.currentUser, adminType });
  };

  const logout = async () => {
    try {
      await signOut(adminAuth);
      // Clear any user-related data from localStorage
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('adminType');
      setUser(null);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(adminAuth, provider);
    const user = result.user;
    const adminDoc = await getDoc(doc(adminDB, 'admins', user.email));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      const adminType = data.propertyType === 'Homestays' ? 'homestay' : 'hotel';
      localStorage.setItem('adminType', adminType);
      setUser({ ...user, adminType });
      return adminType;
    } else {
      await signOut(adminAuth);
      throw new Error("Admin account not found. Please register first.");
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
