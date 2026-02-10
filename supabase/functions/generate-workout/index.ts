import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goal, gender, weight, level = "beginner" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const menSplit = `
Session A - Chest, Triceps & Shoulders
Session B - Back & Biceps  
Session C - Full Legs (Quadriceps, Hamstrings, Calves)`;

    const womenSplit = `
Session A - Quadriceps
Session B - Chest, Triceps & Shoulders
Session C - Back & Biceps
Session D - Hamstrings & Glutes`;

    const split = gender === "female" ? womenSplit : menSplit;
    const sessionCount = gender === "female" ? 4 : 3;

    // Exercise count varies by level
    let exerciseRange: string;
    let setsRange: string;
    let levelDescription: string;
    
    switch (level) {
      case "beginner":
        exerciseRange = "3-4";
        setsRange = "2-3";
        levelDescription = "Keep it simple with fundamental compound movements. Focus on form over weight.";
        break;
      case "intermediate":
        exerciseRange = "5-6";
        setsRange = "3-4";
        levelDescription = "Mix compound and isolation movements. Include some advanced techniques like supersets.";
        break;
      case "advanced":
        exerciseRange = "7-8";
        setsRange = "3-5";
        levelDescription = "Include advanced movements, drop sets, supersets. High volume training with both compound and isolation exercises.";
        break;
      default:
        exerciseRange = "5-7";
        setsRange = "3-4";
        levelDescription = "Standard training program.";
    }

    const prompt = `You are a professional fitness coach. Generate a ${goal === "fat_burning" ? "fat burning" : "hypertrophy"} workout plan for a ${gender} weighing ${weight}kg. Training level: ${level}.

Use this split structure:
${split}

Rules:
- Each session should have ${exerciseRange} exercises
- ${levelDescription}
- Minimum 10 reps per exercise suggested
- For fat burning: higher reps (12-15), shorter rest, include supersets
- For hypertrophy: moderate reps (10-12), progressive overload focus
- Include compound and isolation movements
- Sets should be ${setsRange} per exercise

Return ONLY valid JSON in this exact format:
{
  "name": "Plan name here",
  "sessions": [
    {
      "name": "A",
      "label": "Muscle groups here",
      "sort_order": 0,
      "exercises": [
        {
          "name": "Exercise Name",
          "muscle_group": "Chest",
          "sets": 3,
          "suggested_reps": 12
        }
      ]
    }
  ]
}

Valid muscle_group values: Chest, Back, Shoulders, Biceps, Triceps, Quadriceps, Hamstrings, Glutes, Calves, Forearms, Core

Generate exactly ${sessionCount} sessions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a fitness expert. Return only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const plan = JSON.parse(content);

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-workout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
