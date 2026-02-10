import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Dumbbell, ChevronRight, Flame, Heart } from "lucide-react";

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
  const [streak, setStreak] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Fetch plans
    supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPlans(data || []);
        setLoading(false);
      });

    // Calculate streak
    computeStreak(user.id);
  }, [user]);

  const computeStreak = async (userId: string) => {
    // Get workout log dates
    const { data: workoutLogs } = await supabase
      .from("workout_logs")
      .select("logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false });

    // Get cardio log dates
    const { data: cardioLogs } = await supabase
      .from("cardio_logs")
      .select("logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false });

    // Build set of unique dates with activity
    const dateCountMap = new Map<string, number>();

    (workoutLogs || []).forEach((log) => {
      const date = new Date(log.logged_at).toLocaleDateString("en-CA"); // YYYY-MM-DD
      dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
    });

    // Cardio counts as full day (1 session = qualifies)
    const cardioDates = new Set<string>();
    (cardioLogs || []).forEach((log) => {
      cardioDates.add(new Date(log.logged_at).toLocaleDateString("en-CA"));
    });

    // A day qualifies if: 2+ workout logs OR 1+ cardio session
    const qualifiedDates = new Set<string>();
    dateCountMap.forEach((count, date) => {
      if (count >= 2) qualifiedDates.add(date);
    });
    cardioDates.forEach((date) => qualifiedDates.add(date));

    // Count consecutive days from today backwards
    let currentStreak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-CA");
      if (qualifiedDates.has(dateStr)) {
        currentStreak++;
      } else if (i === 0) {
        // Today might not have activity yet, still check yesterday
        continue;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-display tracking-wider">
              MY <span className="text-primary">WORKOUTS</span>
            </h1>
            <p className="text-muted-foreground mt-1">Manage your training plans</p>
          </div>
          {/* Streak badge */}
          <div className="flex flex-col items-center gap-1">
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${
              streak > 0 ? "bg-accent/10 border border-accent/30" : "bg-secondary border border-border/50"
            }`}>
              <Flame className={`h-5 w-5 ${streak > 0 ? "text-accent" : "text-muted-foreground"}`} />
              <span className={`font-display text-2xl ${streak > 0 ? "text-accent" : "text-muted-foreground"}`}>
                {streak}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">day streak</span>
          </div>
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

        {/* Cardio quick link */}
        <Button
          onClick={() => navigate("/cardio")}
          variant="outline"
          className="w-full h-auto p-4 justify-start gap-3"
        >
          <Heart className="h-5 w-5 text-destructive" />
          <div className="text-left">
            <p className="font-semibold">Cardio Session</p>
            <p className="text-xs text-muted-foreground">Treadmill, bike, stairs & more</p>
          </div>
        </Button>

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
