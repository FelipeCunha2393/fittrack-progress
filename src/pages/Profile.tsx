import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TrendingDown, TrendingUp, Minus, Scale } from "lucide-react";

type WeightEntry = { id: string; weight_kg: number; recorded_at: string };

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [newWeight, setNewWeight] = useState("");
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("weight_history")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .then(({ data }) => setHistory(data || []));
  }, [user]);

  const addWeight = async () => {
    if (!user || !newWeight) return;
    setSubmitting(true);
    const w = parseFloat(newWeight);
    await supabase.from("weight_history").insert({ user_id: user.id, weight_kg: w });
    await supabase.from("profiles").update({ current_weight_kg: w }).eq("id", user.id);
    await refreshProfile();
    const { data } = await supabase
      .from("weight_history")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false });
    setHistory(data || []);
    setNewWeight("");
    toast({ title: "Weight updated!" });
    setSubmitting(false);
  };

  const diff = profile ? (profile.current_weight_kg ?? 0) - (profile.initial_weight_kg ?? 0) : 0;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="text-4xl font-display tracking-wider">
          MY <span className="text-primary">PROFILE</span>
        </h1>

        {profile && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase">Gender</p>
                <p className="text-lg font-semibold capitalize">{profile.gender}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase">Height</p>
                <p className="text-lg font-semibold">{profile.height_cm} cm</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase">Starting</p>
                <p className="text-lg font-semibold">{profile.initial_weight_kg} kg</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase">Current</p>
                <p className="text-lg font-semibold flex items-center justify-center gap-1">
                  {profile.current_weight_kg} kg
                  {diff < 0 && <TrendingDown className="h-4 w-4 text-primary" />}
                  {diff > 0 && <TrendingUp className="h-4 w-4 text-accent" />}
                  {diff === 0 && <Minus className="h-4 w-4 text-muted-foreground" />}
                </p>
                <p className="text-xs text-muted-foreground">
                  {diff > 0 ? "+" : ""}{diff.toFixed(1)} kg from start
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> Log Weight
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 74.5"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
            />
            <Button onClick={addWeight} disabled={submitting || !newWeight}>
              Add
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Weight History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((entry) => (
                  <div key={entry.id} className="flex justify-between text-sm border-b border-border/30 pb-2">
                    <span>{entry.weight_kg} kg</span>
                    <span className="text-muted-foreground">
                      {new Date(entry.recorded_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
