import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Dumbbell, ChevronRight } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  goal: string | null;
  created_at: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPlans(data || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display tracking-wider">
            MY <span className="text-primary">WORKOUTS</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage your training plans</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={() => navigate("/generate")}
            className="h-auto flex-col items-start gap-2 p-4 text-left"
            variant="outline"
          >
            <Sparkles className="h-5 w-5 text-accent" />
            <div>
              <p className="font-semibold">AI Generate</p>
              <p className="text-xs text-muted-foreground">Get a personalized plan</p>
            </div>
          </Button>
          <Button
            onClick={() => navigate("/create")}
            className="h-auto flex-col items-start gap-2 p-4 text-left"
            variant="outline"
          >
            <Plus className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Custom Workout</p>
              <p className="text-xs text-muted-foreground">Build your own plan</p>
            </div>
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : plans.length === 0 ? (
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No workouts yet</p>
              <p className="text-sm text-muted-foreground/70">Generate one with AI or create your own</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <Link key={plan.id} to={`/plan/${plan.id}`}>
                <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      {plan.goal && (
                        <span className="text-xs text-accent capitalize">
                          {plan.goal.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
