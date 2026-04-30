import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Phone, Briefcase, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { auth, RecaptchaVerifier } from "@/lib/firebase";
import { signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { toast } from "sonner";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const Index = () => {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      nav(role === "officer" ? "/officer/dashboard" : "/policies", { replace: true });
    }
  }, [user, role, loading, nav]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  };

  const sendOtp = async () => {
    if (!phone.match(/^\+\d{10,15}$/)) {
      toast.error("Enter phone in international format e.g. +919876543210");
      return;
    }
    setBusy(true);
    try {
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier!);
      window.confirmationResult = result;
      setOtpSent(true);
      toast.success("OTP sent");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!window.confirmationResult) return;
    setBusy(true);
    try {
      await window.confirmationResult.confirm(otp);
      toast.success("Welcome!");
      // Navigation handled by AuthContext + effect
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid OTP");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-8 text-center text-primary-foreground">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background/95 shadow-soft">
            <Sprout className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Kisan Vaani</h1>
          <p className="mt-2 text-lg opacity-95">किसानों की आवाज़ • The Farmer's Voice</p>
        </div>

        <Card className="w-full max-w-md shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" /> Farmer Login
            </CardTitle>
            <CardDescription>Sign in with your phone number to access policies and submit feedback.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                  />
                </div>
                <Button onClick={sendOtp} disabled={busy} className="w-full" size="lg">
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <Button onClick={verifyOtp} disabled={busy} className="w-full" size="lg">
                  Verify & Sign in
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setOtpSent(false)}>
                  Use a different number
                </Button>
              </>
            )}
            <div id="recaptcha-container" />
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col items-center gap-2 text-primary-foreground">
          <Link to="/officer/login" className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline">
            <Briefcase className="h-4 w-4" /> Officer login
          </Link>
          <Link to="/officer/signup" className="inline-flex items-center gap-2 text-xs opacity-90 hover:underline">
            <ShieldCheck className="h-3.5 w-3.5" /> Create officer account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
