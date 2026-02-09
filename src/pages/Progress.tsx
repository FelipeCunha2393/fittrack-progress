import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Progress() {
  const { user } = useAuth();
  const [weightData, setWeightData] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("weight_history")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: true })
      .then(({ data }) =>
        setWeightData(
          (data || []).map((d) => ({
            date: new Date(d.recorded_at).toLocaleDateString(),
            weight: d.weight_kg,
          }))
        )
      );

    supabase
      .from("workout_logs")
      .select("*, session_exercises(name, muscle_group)")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setLogs(data || []));
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-4xl font-display tracking-wider">
          MY <span className="text-primary">PROGRESS</span>
        </h1>

        <Tabs defaultValue="charts">
          <TabsList className="w-full">
            <TabsTrigger value="charts" className="flex-1">Charts</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Log History</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4 mt-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Body Weight</CardTitle>
              </CardHeader>
              <CardContent>
                {weightData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Log at least 2 weight entries to see the chart</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No workout logs yet</p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="flex justify-between text-sm border-b border-border/30 pb-2">
                        <div>
                          <p className="font-medium">{(log.session_exercises as any)?.name || "Exercise"}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {(log.session_exercises as any)?.muscle_group}
                          </p>
                        </div>
                        <div className="text-right">
                          <p>{log.reps_completed} reps × {log.weight_used} kg</p>
                          <p className="text-xs text-muted-foreground">{new Date(log.logged_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
