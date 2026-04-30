import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const OfficerSignup = () => {
  const { setUserRole } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setUserRole(cred.user.uid, "officer");
      toast.success("Officer account created");
      nav("/officer/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Create Officer Account
            </CardTitle>
            <CardDescription>Register to access the grievance dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full" size="lg">
                Create account
              </Button>
            </form>
            <div className="mt-4 flex justify-between text-sm">
              <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Farmer login
              </Link>
              <Link to="/officer/login" className="text-primary hover:underline">
                Already an officer?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OfficerSignup;
