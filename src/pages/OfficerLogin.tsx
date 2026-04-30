import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const OfficerLogin = () => {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      nav(role === "officer" ? "/officer/dashboard" : "/policies", { replace: true });
    }
  }, [user, role, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Signed in");
    } catch (err: any) {
      toast.error(err?.message ?? "Login failed");
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
              <Briefcase className="h-5 w-5 text-primary" /> Officer Login
            </CardTitle>
            <CardDescription>Access the grievance management dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={busy} className="w-full" size="lg">
                Sign in
              </Button>
            </form>
            <div className="mt-4 flex justify-between text-sm">
              <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Farmer login
              </Link>
              <Link to="/officer/signup" className="text-primary hover:underline">
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OfficerLogin;
