import { Link } from "react-router-dom";
import { Sprout, Phone, Briefcase, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-10 text-center text-primary-foreground">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background/95 shadow-soft">
            <Sprout className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Kisan Vaani</h1>
          <p className="mt-2 text-lg opacity-95">किसानों की आवाज़ • The Farmer's Voice</p>
          <p className="mt-3 text-sm opacity-90">Choose how you want to sign in</p>
        </div>

        <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
          <Card className="shadow-soft transition-transform hover:-translate-y-1">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <CardTitle>Farmer</CardTitle>
              <CardDescription>
                Sign in with your phone number to view policies and submit voice feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/farmer/login">
                <Button className="w-full" size="lg">
                  Farmer Login <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-soft transition-transform hover:-translate-y-1">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              <CardTitle>Officer</CardTitle>
              <CardDescription>
                Sign in with email to manage grievances, applications, and publish schemes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/officer/login">
                <Button className="w-full" size="lg">
                  Officer Login <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/officer/signup">
                <Button variant="outline" className="w-full" size="sm">
                  Create officer account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;
