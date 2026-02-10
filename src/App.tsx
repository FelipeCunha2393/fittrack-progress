import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";
import GenerateWorkout from "./pages/GenerateWorkout";
import CreateWorkout from "./pages/CreateWorkout";
import PlanDetail from "./pages/PlanDetail";
import Cardio from "./pages/Cardio";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

function OnboardingRoute() {
  const { user, loading, profile } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;
  return <Onboarding />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/generate" element={<ProtectedRoute><GenerateWorkout /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreateWorkout /></ProtectedRoute>} />
            <Route path="/plan/:id" element={<ProtectedRoute><PlanDetail /></ProtectedRoute>} />
            <Route path="/cardio" element={<ProtectedRoute><Cardio /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
