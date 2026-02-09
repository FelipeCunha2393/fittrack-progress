import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  sets: number;
  suggested_reps: number;
  sort_order: number;
};

type Session = {
  id: string;
  name: string;
  label: string | null;
  sort_order: number;
  exercises: Exercise[];
};

export default function PlanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [logExercise, setLogExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    supabase.from("workout_plans").select("*").eq("id", id).maybeSingle().then(({ data }) => setPlan(data));
    supabase
      .from("workout_sessions")
      .select("*, session_exercises(*)")
      .eq("plan_id", id)
      .order("sort_order")
      .then(({ data }) => {
        const mapped = (data || []).map((s: any) => ({
          ...s,
          exercises: (s.session_exercises || []).sort((a: Exercise, b: Exercise) => a.sort_order - b.sort_order),
        }));
        setSessions(mapped);
        if (mapped.length > 0) setExpandedSession(mapped[0].id);
      });
  }, [id]);

  const openLog = async (exercise: Exercise) => {
    setLogExercise(exercise);
    setReps("");
    setWeight("");
    if (user) {
      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("exercise_id", exercise.id)
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(5);
      setLogs(data || []);
    }
  };

  const saveLog = async () => {
    if (!user || !logExercise || !reps || !weight) return;
    const { error } = await supabase.from("workout_logs").insert({
      user_id: user.id,
      exercise_id: logExercise.id,
      reps_completed: parseInt(reps),
      weight_used: parseFloat(weight),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged!" });
      setLogExercise(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-lg mx-auto">
        {plan && (
          <div>
            <h1 className="text-3xl font-display tracking-wider">{plan.name}</h1>
            {plan.goal && (
              <span className="text-sm text-accent capitalize">{plan.goal.replace("_", " ")}</span>
            )}
          </div>
        )}

        {sessions.map((session) => (
          <Card key={session.id} className="border-border/50 overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4"
              onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
            >
              <div className="text-left">
                <span className="font-display text-xl tracking-wider text-primary">{session.name}</span>
                {session.label && <p className="text-xs text-muted-foreground">{session.label}</p>}
              </div>
              {expandedSession === session.id ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            {expandedSession === session.id && (
              <CardContent className="pt-0 space-y-2">
                {session.exercises.map((ex) => (
                  <Dialog key={ex.id}>
                    <DialogTrigger asChild>
                      <button
                        onClick={() => openLog(ex)}
                        className="w-full text-left rounded-md border border-border/30 p-3 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{ex.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{ex.muscle_group}</p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>{ex.sets} × {ex.suggested_reps} reps</p>
                          </div>
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>{ex.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Reps</label>
                            <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder={`${ex.suggested_reps}`} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Weight (kg)</label>
                            <Input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
                          </div>
                        </div>
                        <Button onClick={saveLog} className="w-full" disabled={!reps || !weight}>
                          <Plus className="h-4 w-4 mr-1" /> Log Set
                        </Button>
                        {logs.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Recent logs</p>
                            {logs.map((log) => (
                              <div key={log.id} className="flex justify-between text-xs border-b border-border/20 py-1">
                                <span>{log.reps_completed} reps × {log.weight_used} kg</span>
                                <span className="text-muted-foreground">{new Date(log.logged_at).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
