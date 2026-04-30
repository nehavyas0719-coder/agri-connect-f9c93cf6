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

  const resolveRole = async (u: User): Promise<Role> => {
    // Retry a couple times in case the user doc was just written by signup
    for (let i = 0; i < 4; i++) {
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const r = (snap.data().role as Role) ?? null;
        if (r) return r;
      }
      // If phone user without doc yet, create as farmer
      if (u.phoneNumber) {
        await setDoc(doc(db, "users", u.uid), {
          role: "farmer",
          createdAt: new Date().toISOString(),
          phone: u.phoneNumber,
          email: u.email ?? null,
        });
        return "farmer";
      }
      // email user with no doc yet — wait briefly for signup writer
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const r = await resolveRole(u);
        setRole(r);
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
