import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Check, ChevronDown, ChevronUp } from "lucide-react";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, MUSCLE_IMAGES, getExercisesByMuscle } from "@/data/exerciseLibrary";

type SelectedExercise = { name: string; muscle_group: string; sets: number; reps: number };
type SessionInput = { name: string; label: string; exercises: SelectedExercise[] };

export default function CreateWorkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [planName, setPlanName] = useState("");
  const [sessions, setSessions] = useState<SessionInput[]>([
    { name: "A", label: "", exercises: [] },
  ]);
  const [saving, setSaving] = useState(false);
  const [activeSession, setActiveSession] = useState(0);
  const [expandedMuscle, setExpandedMuscle] = useState<string | null>(null);

  const addSession = () => {
    const names = ["A", "B", "C", "D", "E", "F"];
    const next = names[sessions.length] || `S${sessions.length + 1}`;
    setSessions([...sessions, { name: next, label: "", exercises: [] }]);
    setActiveSession(sessions.length);
  };

  const toggleExercise = (name: string, muscle_group: string) => {
    const updated = [...sessions];
    const session = updated[activeSession];
    const idx = session.exercises.findIndex((e) => e.name === name);
    if (idx >= 0) {
      session.exercises.splice(idx, 1);
    } else {
      session.exercises.push({ name, muscle_group, sets: 3, reps: 10 });
    }
    setSessions(updated);
  };

  const isSelected = (name: string) =>
    sessions[activeSession]?.exercises.some((e) => e.name === name);

  const removeExercise = (ei: number) => {
    const updated = [...sessions];
    updated[activeSession].exercises.splice(ei, 1);
    setSessions(updated);
  };

  const updateExerciseField = (ei: number, field: "sets" | "reps", value: number) => {
    const updated = [...sessions];
    updated[activeSession].exercises[ei][field] = value;
    setSessions(updated);
  };

  const updateSession = (si: number, field: "name" | "label", value: string) => {
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

        if (s.exercises.length > 0) {
          await supabase.from("session_exercises").insert(
            s.exercises.map((ex, i) => ({
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

  const currentSession = sessions[activeSession];

  return (
    <AppLayout>
      <div className="space-y-4 max-w-lg mx-auto pb-20">
        <h1 className="text-3xl font-display tracking-wider">
          CUSTOM <span className="text-primary">WORKOUT</span>
        </h1>

        <div className="space-y-2">
          <Label>Plan Name</Label>
          <Input placeholder="e.g. Push Pull Legs" value={planName} onChange={(e) => setPlanName(e.target.value)} />
        </div>

        {/* Session tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sessions.map((s, si) => (
            <button
              key={si}
              onClick={() => setActiveSession(si)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeSession === si
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {s.name} {s.exercises.length > 0 && `(${s.exercises.length})`}
            </button>
          ))}
          <button
            onClick={addSession}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-sm border border-dashed border-border text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Session label */}
        <Input
          placeholder="Session label (e.g. Chest & Triceps)"
          value={currentSession?.label || ""}
          onChange={(e) => updateSession(activeSession, "label", e.target.value)}
        />

        {/* Selected exercises for this session */}
        {currentSession?.exercises.length > 0 && (
          <Card className="border-primary/30">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold text-primary uppercase">Selected ({currentSession.exercises.length})</p>
              {currentSession.exercises.map((ex, ei) => (
                <div key={ei} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                  <img src={MUSCLE_IMAGES[ex.muscle_group]} alt={ex.muscle_group} className="w-8 h-8 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ex.muscle_group}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="w-12 h-7 text-xs text-center p-0"
                      value={ex.sets}
                      onChange={(e) => updateExerciseField(ei, "sets", parseInt(e.target.value) || 1)}
                    />
                    <span className="text-[10px] text-muted-foreground">×</span>
                    <Input
                      type="number"
                      className="w-12 h-7 text-xs text-center p-0"
                      value={ex.reps}
                      onChange={(e) => updateExerciseField(ei, "reps", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeExercise(ei)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Exercise browser by muscle group */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Add Exercises</p>
          {MUSCLE_GROUPS.map((muscle) => {
            const exercises = getExercisesByMuscle(muscle);
            const isExpanded = expandedMuscle === muscle;
            const selectedCount = currentSession?.exercises.filter((e) => e.muscle_group === muscle).length || 0;

            return (
              <div key={muscle} className="rounded-lg border border-border/50 overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedMuscle(isExpanded ? null : muscle)}
                >
                  <img src={MUSCLE_IMAGES[muscle]} alt={muscle} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">{muscle}</p>
                    <p className="text-[10px] text-muted-foreground">{exercises.length} exercises</p>
                  </div>
                  {selectedCount > 0 && (
                    <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {isExpanded && (
                  <div className="border-t border-border/30 p-2 grid gap-1">
                    {exercises.map((ex) => {
                      const selected = isSelected(ex.name);
                      return (
                        <button
                          key={ex.name}
                          onClick={() => toggleExercise(ex.name, ex.muscle_group)}
                          className={`flex items-center gap-3 p-2 rounded-md text-left transition-all ${
                            selected
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-secondary/50"
                          }`}
                        >
                          <img src={MUSCLE_IMAGES[muscle]} alt={muscle} className="w-8 h-8 rounded object-cover opacity-70" />
                          <p className="flex-1 text-sm">{ex.name}</p>
                          {selected && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button onClick={handleSave} className="w-full font-semibold" size="lg" disabled={saving || !planName}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Workout"}
        </Button>
      </div>
    </AppLayout>
  );
}
