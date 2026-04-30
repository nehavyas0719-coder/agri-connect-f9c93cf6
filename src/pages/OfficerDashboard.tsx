import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Activity, BarChart3, FileText, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  schemeId: string;
  farmerId: string;
  status: "Pending" | "Action Taken";
  name?: string;
}
interface Feedback {
  id: string;
  originalText: string;
  translation: string;
  sentiment: "Urgent" | "Frustrated" | "Positive" | "Normal";
  summary: string;
  status: "Pending" | "Action Taken";
  resolutionMessage?: string;
  phone?: string;
  createdAt: string;
}

const sentimentColors: Record<string, string> = {
  Urgent: "hsl(var(--sentiment-urgent))",
  Frustrated: "hsl(var(--sentiment-frustrated))",
  Positive: "hsl(var(--sentiment-positive))",
  Normal: "hsl(var(--sentiment-normal))",
};

const sentimentBadge: Record<string, string> = {
  Urgent: "bg-[hsl(var(--sentiment-urgent))] text-white",
  Frustrated: "bg-[hsl(var(--sentiment-frustrated))] text-white",
  Positive: "bg-[hsl(var(--sentiment-positive))] text-white",
  Normal: "bg-[hsl(var(--sentiment-normal))] text-white",
};

const OfficerDashboard = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [actionTarget, setActionTarget] = useState<{ kind: "app" | "fb"; id: string; label: string } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "applications"), (s) =>
      setApps(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    const u2 = onSnapshot(query(collection(db, "feedback"), orderBy("createdAt", "desc")), (s) =>
      setFeedback(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    return () => { u1(); u2(); };
  }, []);

  const appPie = useMemo(() => {
    const pending = apps.filter((a) => a.status === "Pending").length;
    const taken = apps.filter((a) => a.status === "Action Taken").length;
    return [
      { name: "Pending", value: pending },
      { name: "Action Taken", value: taken },
    ];
  }, [apps]);

  const sentimentBars = useMemo(() => {
    const counts: Record<string, number> = { Urgent: 0, Frustrated: 0, Positive: 0, Normal: 0 };
    feedback.forEach((f) => { counts[f.sentiment] = (counts[f.sentiment] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [feedback]);

  const submit = async () => {
    if (!actionTarget) return;
    setBusy(true);
    try {
      const ref = doc(db, actionTarget.kind === "app" ? "applications" : "feedback", actionTarget.id);
      await updateDoc(ref, { status: "Action Taken", resolutionMessage: message, resolvedAt: new Date().toISOString() });
      toast.success("Action recorded");
      setActionTarget(null);
      setMessage("");
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Officer Dashboard</h1>
          <p className="text-muted-foreground">Monitor grievances and applications in real time.</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={FileText} label="Total applications" value={apps.length} />
          <StatCard icon={MessageSquare} label="Total feedback" value={feedback.length} />
          <StatCard icon={Activity} label="Urgent issues" value={feedback.filter((f) => f.sentiment === "Urgent").length} />
          <StatCard icon={CheckCircle2} label="Resolved" value={apps.filter(a => a.status === "Action Taken").length + feedback.filter(f => f.status === "Action Taken").length} />
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Application status</CardTitle>
              <CardDescription>Pending vs. Action Taken</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={appPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    <Cell fill="hsl(var(--sentiment-frustrated))" />
                    <Cell fill="hsl(var(--primary))" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Feedback sentiment</CardTitle>
              <CardDescription>Distribution of farmer voices</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentBars}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {sentimentBars.map((s, i) => (
                      <Cell key={i} fill={sentimentColors[s.name]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Grievance Management</CardTitle>
            <CardDescription>Real-time farmer feedback with AI translation & sentiment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No feedback yet.</TableCell></TableRow>
                  ) : feedback.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <Badge className={sentimentBadge[f.sentiment]}>{f.sentiment}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px]">{f.summary}</TableCell>
                      <TableCell className="max-w-[200px] text-sm text-muted-foreground">{f.originalText}</TableCell>
                      <TableCell className="max-w-[260px] text-sm">{f.translation}</TableCell>
                      <TableCell>
                        {f.status === "Action Taken" ? (
                          <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" /> Resolved</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {f.status === "Pending" && (
                          <Button size="sm" onClick={() => setActionTarget({ kind: "fb", id: f.id, label: f.summary })}>
                            Take Action
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pending Applications</CardTitle>
            <CardDescription>Send a resolution to the applicant.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Scheme ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No applications yet.</TableCell></TableRow>
                ) : apps.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.name ?? a.farmerId.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">{a.schemeId.slice(0, 10)}…</TableCell>
                    <TableCell>
                      {a.status === "Action Taken" ? (
                        <Badge variant="secondary">Resolved</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.status === "Pending" && (
                        <Button size="sm" onClick={() => setActionTarget({ kind: "app", id: a.id, label: `Application from ${a.name ?? "farmer"}` })}>
                          Take Action
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take action</DialogTitle>
            <DialogDescription>{actionTarget?.label}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Resolution message to send back to the farmer…"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionTarget(null)}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !message.trim()}>Send & mark resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <Card className="shadow-card">
    <CardContent className="flex items-center gap-4 py-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);

export default OfficerDashboard;
