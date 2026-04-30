import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sprout, FileText, MessageSquare, BarChart3, PlusSquare, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const NavBar = () => {
  const { role, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const farmerLinks = [
    { to: "/policies", label: "Policies", icon: FileText },
    { to: "/feedback", label: "Feedback", icon: MessageSquare },
  ];
  const officerLinks = [
    { to: "/officer/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/officer/add-scheme", label: "Add Scheme", icon: PlusSquare },
  ];
  const links = role === "officer" ? officerLinks : farmerLinks;

  const handleSignOut = async () => {
    await signOut();
    nav("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to={role === "officer" ? "/officer/dashboard" : "/policies"} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">Kisan Vaani</div>
            <div className="text-xs text-muted-foreground capitalize">{role} portal</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:ml-2 sm:inline">Sign out</span>
          </Button>
        </nav>
      </div>
    </header>
  );
};
