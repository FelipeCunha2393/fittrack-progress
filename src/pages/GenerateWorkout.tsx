import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Flame, Zap, Sparkles, Loader2, Baby, Dumbbell, Trophy } from "lucide-react";

type Level = "beginner" | "intermediate" | "advanced";

export default function GenerateWorkout() {
  const { user, profile } = useAuth();
  const [goal, setGoal] = useState<"fat_burning" | "hypertrophy" | "">("");
  const [level, setLevel] = useState<Level | "">("");
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!user || !goal || !level || !profile) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: { goal, gender: profile.gender, weight: profile.current_weight_kg, level },
      });

      if (error) throw error;

      const { data: plan, error: planErr } = await supabase
        .from("workout_plans")
        .insert({ user_id: user.id, name: data.name, goal })
        .select()
        .single();
      if (planErr) throw planErr;

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
        <p className="text-muted-foreground">Choose your goal and level for a personalized plan</p>

        {/* Goal selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Goal</p>
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
        </div>

        {/* Level selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Training Level</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "beginner" as Level, icon: Baby, label: "Beginner", desc: "3-4 exercises/session" },
              { value: "intermediate" as Level, icon: Dumbbell, label: "Intermediate", desc: "5-6 exercises/session" },
              { value: "advanced" as Level, icon: Trophy, label: "Advanced", desc: "7-8 exercises/session" },
            ]).map(({ value, icon: Icon, label, desc }) => (
              <button
                key={value}
                onClick={() => setLevel(value)}
                className={`text-center rounded-lg border-2 p-3 transition-all ${
                  level === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <Icon className={`h-5 w-5 mx-auto mb-1 ${level === value ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!goal || !level || generating}
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
