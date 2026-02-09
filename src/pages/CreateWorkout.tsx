import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

const MUSCLE_GROUPS = [
  "Quadriceps", "Hamstrings", "Back", "Chest", "Shoulders", "Biceps", "Triceps", "Forearms",
];

type ExerciseInput = { name: string; muscle_group: string; sets: number; reps: number };
type SessionInput = { name: string; label: string; exercises: ExerciseInput[] };

export default function CreateWorkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [planName, setPlanName] = useState("");
  const [sessions, setSessions] = useState<SessionInput[]>([
    { name: "A", label: "", exercises: [{ name: "", muscle_group: "Chest", sets: 3, reps: 10 }] },
  ]);
  const [saving, setSaving] = useState(false);

  const addSession = () => {
    const names = ["A", "B", "C", "D", "E", "F"];
    const next = names[sessions.length] || `S${sessions.length + 1}`;
    setSessions([...sessions, { name: next, label: "", exercises: [{ name: "", muscle_group: "Chest", sets: 3, reps: 10 }] }]);
  };

  const addExercise = (si: number) => {
    const updated = [...sessions];
    updated[si].exercises.push({ name: "", muscle_group: "Chest", sets: 3, reps: 10 });
    setSessions(updated);
  };

  const removeExercise = (si: number, ei: number) => {
    const updated = [...sessions];
    updated[si].exercises.splice(ei, 1);
    setSessions(updated);
  };

  const updateExercise = (si: number, ei: number, field: keyof ExerciseInput, value: any) => {
    const updated = [...sessions];
    (updated[si].exercises[ei] as any)[field] = value;
    setSessions(updated);
  };

  const updateSession = (si: number, field: keyof SessionInput, value: string) => {
    const updated = [...sessions];
    (updated[si] as any)[field] = value;
    setSessions(updated);
  };

  const handleSave = async () => {
    if (!user || !planName) return;
    setSaving(true);

    try {
      const { data: plan, error: planErr } = await supabase
        .from("workout_plans")
        .insert({ user_id: user.id, name: planName, goal: "custom" })
        .select()
        .single();
      if (planErr) throw planErr;

      for (let si = 0; si < sessions.length; si++) {
        const s = sessions[si];
        const { data: ws, error: wsErr } = await supabase
          .from("workout_sessions")
          .insert({ plan_id: plan.id, name: s.name, label: s.label || null, sort_order: si })
          .select()
          .single();
        if (wsErr) throw wsErr;

        const validExercises = s.exercises.filter((ex) => ex.name.trim());
        if (validExercises.length > 0) {
          await supabase.from("session_exercises").insert(
            validExercises.map((ex, i) => ({
              session_id: ws.id,
              name: ex.name,
              muscle_group: ex.muscle_group,
              sets: ex.sets,
              suggested_reps: ex.reps,
              sort_order: i,
            }))
          );
        }
      }

      toast({ title: "Workout created!" });
      navigate(`/plan/${plan.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="text-3xl font-display tracking-wider">
          CUSTOM <span className="text-primary">WORKOUT</span>
        </h1>

        <div className="space-y-2">
          <Label>Plan Name</Label>
          <Input placeholder="e.g. Push Pull Legs" value={planName} onChange={(e) => setPlanName(e.target.value)} />
        </div>

        {sessions.map((session, si) => (
          <Card key={si} className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Session name"
                  value={session.name}
                  onChange={(e) => updateSession(si, "name", e.target.value)}
                  className="w-20"
                />
                <Input
                  placeholder="Label (e.g. Chest & Triceps)"
                  value={session.label}
                  onChange={(e) => updateSession(si, "label", e.target.value)}
                  className="flex-1"
                />
              </div>

              {session.exercises.map((ex, ei) => (
                <div key={ei} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-end">
                  <Input placeholder="Exercise name" value={ex.name} onChange={(e) => updateExercise(si, ei, "name", e.target.value)} />
                  <Select value={ex.muscle_group} onValueChange={(v) => updateExercise(si, ei, "muscle_group", v)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map((mg) => (
                        <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" className="w-14" value={ex.sets} onChange={(e) => updateExercise(si, ei, "sets", parseInt(e.target.value) || 1)} />
                  <Input type="number" className="w-14" value={ex.reps} onChange={(e) => updateExercise(si, ei, "reps", parseInt(e.target.value) || 1)} />
                  <Button variant="ghost" size="icon" onClick={() => removeExercise(si, ei)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addExercise(si)}>
                <Plus className="h-4 w-4 mr-1" /> Add Exercise
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addSession} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Add Session
        </Button>

        <Button onClick={handleSave} className="w-full font-semibold" size="lg" disabled={saving || !planName}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Workout"}
        </Button>
      </div>
    </AppLayout>
  );
}
