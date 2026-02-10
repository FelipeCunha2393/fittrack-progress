import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Dumbbell, LayoutDashboard, User, BarChart3, Shield, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Workouts" },
  { to: "/cardio", icon: Heart, label: "Cardio" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isAdmin, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-display text-2xl tracking-wider">
              FIT<span className="text-primary">TRACK</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-accent">
                  <Shield className="h-4 w-4 mr-1" /> Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container flex-1 py-6">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-lg md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
