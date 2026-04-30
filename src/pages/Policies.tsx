import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, addDoc, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Bell, CheckCircle2, Clock, Sprout } from "lucide-react";
import { toast } from "sonner";

interface Scheme {
  id: string;
  title: string;
  category: string;
  eligibility: string;
}

interface Application {
  id: string;
  schemeId: string;
  status: "Pending" | "Action Taken";
  resolutionMessage?: string;
  schemeTitle?: string;
}

const Policies = () => {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Scheme | null>(null);
  const [form, setForm] = useState({ name: "", age: "", address: "", income: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "schemes"), orderBy("createdAt", "desc")), (snap) => {
      setSchemes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "applications"), where("farmerId", "==", user.uid)),
      async (snap) => {
        const apps = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data() as any;
            let schemeTitle = "";
            try {
              const s = await getDoc(doc(db, "schemes", data.schemeId));
              schemeTitle = (s.data() as any)?.title ?? "";
            } catch {}
            return { id: d.id, ...data, schemeTitle } as Application;
          })
        );
        setApplications(apps);
      }
    );
    return unsub;
  }, [user]);

  const apply = async () => {
    if (!selected || !user) return;
    if (!form.name || !form.age || !form.address || !form.income) {
      toast.error("Please fill all fields");
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, "applications"), {
        farmerId: user.uid,
        schemeId: selected.id,
        status: "Pending",
        name: form.name,
        age: Number(form.age),
        address: form.address,
        annualIncome: Number(form.income),
        createdAt: new Date().toISOString(),
      });
      toast.success("Application submitted!", { description: `For: ${selected.title}` });
      setSelected(null);
      setForm({ name: "", age: "", address: "", income: "" });
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  const notifications = applications.filter((a) => a.status === "Action Taken");

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-8">
        {notifications.length > 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-primary" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-md border bg-background p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">Action taken on: {n.schemeTitle}</div>
                    {n.resolutionMessage && (
                      <div className="mt-1 text-sm text-muted-foreground">{n.resolutionMessage}</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Available Policies</h1>
          <p className="text-muted-foreground">Browse and apply for government agricultural schemes.</p>
        </div>

        {schemes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <Sprout className="h-10 w-10" />
              <div>No schemes posted yet. Please check back soon.</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schemes.map((s) => {
              const myApp = applications.find((a) => a.schemeId === s.id);
              return (
                <Card key={s.id} className="flex flex-col shadow-card transition-shadow hover:shadow-soft">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary">{s.category}</Badge>
                    </div>
                    <CardTitle className="mt-3 text-lg">{s.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{s.eligibility}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    {myApp ? (
                      <Button variant="secondary" disabled className="w-full">
                        {myApp.status === "Pending" ? (
                          <><Clock className="mr-2 h-4 w-4" /> Pending</>
                        ) : (
                          <><CheckCircle2 className="mr-2 h-4 w-4" /> Action Taken</>
                        )}
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={() => setSelected(s)}>
                        Apply Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply: {selected?.title}</DialogTitle>
            <DialogDescription>Provide your details to submit the application.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income">Annual income (₹)</Label>
                <Input id="income" type="number" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={apply} disabled={busy}>Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Policies;
