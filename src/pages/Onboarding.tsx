import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Ruler, Weight } from "lucide-react";

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender || !height || !weight || !user) return;

    setSubmitting(true);
    const weightNum = parseFloat(weight);
    const { error } = await supabase
      .from("profiles")
      .update({
        gender,
        height_cm: parseFloat(height),
        initial_weight_kg: weightNum,
        current_weight_kg: weightNum,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (!error) {
      // Also add first weight history entry
      await supabase.from("weight_history").insert({
        user_id: user.id,
        weight_kg: weightNum,
      });
      await refreshProfile();
      navigate("/", { replace: true });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-display tracking-wider">
            SETUP YOUR <span className="text-primary">PROFILE</span>
          </CardTitle>
          <p className="text-muted-foreground text-sm">Tell us about yourself to personalize your experience</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Gender</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`rounded-lg border-2 p-3 text-sm font-medium capitalize transition-all ${
                      gender === g
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-2"><Ruler className="h-4 w-4" /> Height (cm)</Label>
              <Input id="height" type="number" placeholder="175" value={height} onChange={(e) => setHeight(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2"><Weight className="h-4 w-4" /> Weight (kg)</Label>
              <Input id="weight" type="number" step="0.1" placeholder="75" value={weight} onChange={(e) => setWeight(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={submitting || !gender}>
              {submitting ? "Saving..." : "Let's Go!"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
