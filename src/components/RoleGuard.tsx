import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, Role } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  allow: Exclude<Role, null>;
}

export const RoleGuard = ({ children, allow }: Props) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role !== allow) {
    // Logic gate: redirect to the user's correct home
    if (role === "officer") return <Navigate to="/officer/dashboard" replace />;
    if (role === "farmer") return <Navigate to="/policies" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
