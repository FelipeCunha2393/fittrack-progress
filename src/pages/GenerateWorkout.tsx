import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Flame, Zap, Sparkles, Loader2 } from "lucide-react";

export default function GenerateWorkout() {
  const { user, profile } = useAuth();
  const [goal, setGoal] = useState<"fat_burning" | "hypertrophy" | "">("");
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!user || !goal || !profile) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: { goal, gender: profile.gender, weight: profile.current_weight_kg },
      });

      if (error) throw error;

      // Create the plan
      const { data: plan, error: planErr } = await supabase
        .from("workout_plans")
        .insert({ user_id: user.id, name: data.name, goal })
        .select()
        .single();
      if (planErr) throw planErr;

      // Create sessions and exercises
      for (const session of data.sessions) {
        const { data: ws, error: wsErr } = await supabase
          .from("workout_sessions")
          .insert({
            plan_id: plan.id,
            name: session.name,
            label: session.label,
            sort_order: session.sort_order,
          })
          .select()
          .single();
        if (wsErr) throw wsErr;

        const exercises = session.exercises.map((ex: any, i: number) => ({
          session_id: ws.id,
          name: ex.name,
          muscle_group: ex.muscle_group,
          sets: ex.sets,
          suggested_reps: ex.suggested_reps,
          sort_order: i,
        }));

        const { error: exErr } = await supabase.from("session_exercises").insert(exercises);
        if (exErr) throw exErr;
      }

      toast({ title: "Workout generated!", description: data.name });
      navigate(`/plan/${plan.id}`);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Generation failed", description: err.message || "Try again", variant: "destructive" });
    }
    setGenerating(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="text-4xl font-display tracking-wider">
          AI <span className="text-primary">GENERATE</span>
        </h1>
        <p className="text-muted-foreground">Choose your goal and we'll create a personalized plan for you</p>

        <div className="grid gap-3">
          {([
            { value: "fat_burning" as const, icon: Flame, label: "Fat Burning", desc: "High intensity, calorie-torching workouts", color: "text-accent" },
            { value: "hypertrophy" as const, icon: Zap, label: "Hypertrophy", desc: "Build muscle mass and strength", color: "text-primary" },
          ]).map(({ value, icon: Icon, label, desc, color }) => (
            <button
              key={value}
              onClick={() => setGoal(value)}
              className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                goal === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!goal || generating}
          className="w-full font-semibold"
          size="lg"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Generate Workout</>
          )}
        </Button>
      </div>
    </AppLayout>
  );
}
