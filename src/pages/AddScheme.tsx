import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusSquare } from "lucide-react";
import { toast } from "sonner";

const AddScheme = () => {
  const [form, setForm] = useState({ title: "", category: "", eligibility: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await addDoc(collection(db, "schemes"), {
        ...form,
        createdAt: new Date().toISOString(),
      });
      toast.success("Scheme added");
      setForm({ title: "", category: "", eligibility: "" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add scheme");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-2xl py-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusSquare className="h-5 w-5 text-primary" /> Add new scheme
            </CardTitle>
            <CardDescription>Publish a new policy for farmers to apply.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Scheme title</Label>
                <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" required placeholder="e.g. Subsidy, Insurance, Credit" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eligibility">Eligibility & details</Label>
                <Textarea id="eligibility" required rows={5} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
              </div>
              <Button type="submit" disabled={busy} size="lg" className="w-full">
                Publish scheme
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddScheme;
