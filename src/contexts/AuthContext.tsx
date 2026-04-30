import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut as fbSignOut, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Role = "farmer" | "officer" | null;

interface AuthCtx {
  user: User | null;
  role: Role;
  loading: boolean;
  setUserRole: (uid: string, role: Exclude<Role, null>) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  role: null,
  loading: true,
  setUserRole: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(Ctx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          setRole((snap.data().role as Role) ?? null);
        } else {
          // Default: phone auth = farmer, no doc yet
          const defaultRole: Role = u.phoneNumber ? "farmer" : null;
          if (defaultRole) {
            await setDoc(doc(db, "users", u.uid), {
              role: defaultRole,
              createdAt: new Date().toISOString(),
              phone: u.phoneNumber ?? null,
              email: u.email ?? null,
            });
          }
          setRole(defaultRole);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const setUserRole = async (uid: string, r: Exclude<Role, null>) => {
    await setDoc(
      doc(db, "users", uid),
      { role: r, createdAt: new Date().toISOString(), email: auth.currentUser?.email ?? null },
      { merge: true }
    );
    setRole(r);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setRole(null);
  };

  return (
    <Ctx.Provider value={{ user, role, loading, setUserRole, signOut }}>{children}</Ctx.Provider>
  );
};
