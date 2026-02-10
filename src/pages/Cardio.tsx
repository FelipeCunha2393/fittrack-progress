import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Square, Save, Timer, Footprints, Bike, ArrowUpDown } from "lucide-react";

const CARDIO_TYPES = [
  { value: "treadmill", label: "Treadmill", icon: Footprints },
  { value: "bike", label: "Bike", icon: Bike },
  { value: "stairs", label: "Stairs", icon: ArrowUpDown },
  { value: "elliptical", label: "Elliptical", icon: Timer },
];

export default function Cardio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activity, setActivity] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [distance, setDistance] = useState("");
  const [saving, setSaving] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cardio_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setRecentLogs(data || []));
  }, [user]);

  const startTimer = useCallback(() => {
    if (!activity) {
      toast({ title: "Select an activity first", variant: "destructive" });
      return;
    }
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, [activity, toast]);

  const pauseTimer = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setSeconds(0);
  }, [pauseTimer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleSave = async () => {
    if (!user || !activity || seconds === 0) return;
    setSaving(true);
    const { error } = await supabase.from("cardio_logs").insert({
      user_id: user.id,
      activity,
      duration_seconds: seconds,
      distance_km: distance ? parseFloat(distance) : null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cardio saved!" });
      resetTimer();
      setDistance("");
      // Refresh recent logs
      const { data } = await supabase
        .from("cardio_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(10);
      setRecentLogs(data || []);
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="text-4xl font-display tracking-wider">
          CARDIO <span className="text-accent">SESSION</span>
        </h1>

        {/* Activity selection */}
        <div className="grid grid-cols-2 gap-3">
          {CARDIO_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { if (!running) setActivity(value); }}
              className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                activity === value
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/30"
              } ${running ? "opacity-60" : ""}`}
            >
              <Icon className={`h-6 w-6 ${activity === value ? "text-accent" : "text-muted-foreground"}`} />
              <span className="font-semibold text-sm">{label}</span>
            </button>
          ))}
        </div>

        {/* Timer */}
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-8 space-y-6">
            <div className="font-display text-7xl tracking-wider text-foreground tabular-nums">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-3">
              {!running ? (
                <Button onClick={startTimer} size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                  <Play className="h-5 w-5" /> Start
                </Button>
              ) : (
                <Button onClick={pauseTimer} size="lg" variant="secondary" className="gap-2">
                  <Pause className="h-5 w-5" /> Pause
                </Button>
              )}
              {seconds > 0 && !running && (
                <Button onClick={resetTimer} size="lg" variant="outline" className="gap-2">
                  <Square className="h-5 w-5" /> Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distance (optional) */}
        {seconds > 0 && !running && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Distance (km) - optional</label>
            <Input
              type="number"
              step="0.1"
              placeholder="0.0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
        )}

        {/* Save button */}
        {seconds > 0 && !running && (
          <Button onClick={handleSave} className="w-full font-semibold" size="lg" disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Session"}
          </Button>
        )}

        {/* Recent logs */}
        {recentLogs.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Recent Sessions</p>
            {recentLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-center bg-secondary/30 rounded-lg p-3 text-sm">
                <div>
                  <p className="font-medium capitalize">{log.activity}</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.logged_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatTime(log.duration_seconds)}</p>
                  {log.distance_km && <p className="text-xs text-muted-foreground">{log.distance_km} km</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
