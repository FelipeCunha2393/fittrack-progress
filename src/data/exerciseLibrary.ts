import chestImg from "@/assets/muscles/chest.png";
import backImg from "@/assets/muscles/back.png";
import shouldersImg from "@/assets/muscles/shoulders.png";
import bicepsImg from "@/assets/muscles/biceps.png";
import tricepsImg from "@/assets/muscles/triceps.png";
import quadricepsImg from "@/assets/muscles/quadriceps.png";
import hamstringsImg from "@/assets/muscles/hamstrings.png";
import glutesImg from "@/assets/muscles/glutes.png";
import coreImg from "@/assets/muscles/core.png";
import calvesImg from "@/assets/muscles/calves.png";
import forearmsImg from "@/assets/muscles/forearms.png";

export const MUSCLE_IMAGES: Record<string, string> = {
  Chest: chestImg,
  Back: backImg,
  Shoulders: shouldersImg,
  Biceps: bicepsImg,
  Triceps: tricepsImg,
  Quadriceps: quadricepsImg,
  Hamstrings: hamstringsImg,
  Glutes: glutesImg,
  Core: coreImg,
  Calves: calvesImg,
  Forearms: forearmsImg,
};

export type ExerciseItem = {
  name: string;
  muscle_group: string;
};

export const EXERCISE_LIBRARY: ExerciseItem[] = [
  // Chest
  { name: "Bench Press", muscle_group: "Chest" },
  { name: "Incline Bench Press", muscle_group: "Chest" },
  { name: "Decline Bench Press", muscle_group: "Chest" },
  { name: "Dumbbell Flyes", muscle_group: "Chest" },
  { name: "Cable Crossover", muscle_group: "Chest" },
  { name: "Push-Ups", muscle_group: "Chest" },
  { name: "Chest Dip", muscle_group: "Chest" },
  { name: "Incline Dumbbell Press", muscle_group: "Chest" },
  { name: "Machine Chest Press", muscle_group: "Chest" },
  { name: "Pec Deck", muscle_group: "Chest" },

  // Back
  { name: "Pull-Ups", muscle_group: "Back" },
  { name: "Lat Pulldown", muscle_group: "Back" },
  { name: "Barbell Row", muscle_group: "Back" },
  { name: "Seated Cable Row", muscle_group: "Back" },
  { name: "Dumbbell Row", muscle_group: "Back" },
  { name: "T-Bar Row", muscle_group: "Back" },
  { name: "Face Pulls", muscle_group: "Back" },
  { name: "Deadlift", muscle_group: "Back" },
  { name: "Chin-Ups", muscle_group: "Back" },
  { name: "Straight Arm Pulldown", muscle_group: "Back" },

  // Shoulders
  { name: "Overhead Press", muscle_group: "Shoulders" },
  { name: "Lateral Raise", muscle_group: "Shoulders" },
  { name: "Front Raise", muscle_group: "Shoulders" },
  { name: "Rear Delt Fly", muscle_group: "Shoulders" },
  { name: "Arnold Press", muscle_group: "Shoulders" },
  { name: "Upright Row", muscle_group: "Shoulders" },
  { name: "Cable Lateral Raise", muscle_group: "Shoulders" },
  { name: "Machine Shoulder Press", muscle_group: "Shoulders" },

  // Biceps
  { name: "Barbell Curl", muscle_group: "Biceps" },
  { name: "Dumbbell Curl", muscle_group: "Biceps" },
  { name: "Hammer Curl", muscle_group: "Biceps" },
  { name: "Preacher Curl", muscle_group: "Biceps" },
  { name: "Concentration Curl", muscle_group: "Biceps" },
  { name: "Cable Curl", muscle_group: "Biceps" },
  { name: "Incline Dumbbell Curl", muscle_group: "Biceps" },
  { name: "EZ Bar Curl", muscle_group: "Biceps" },

  // Triceps
  { name: "Tricep Pushdown", muscle_group: "Triceps" },
  { name: "Skull Crushers", muscle_group: "Triceps" },
  { name: "Overhead Tricep Extension", muscle_group: "Triceps" },
  { name: "Dips", muscle_group: "Triceps" },
  { name: "Close Grip Bench Press", muscle_group: "Triceps" },
  { name: "Cable Tricep Kickback", muscle_group: "Triceps" },
  { name: "Diamond Push-Ups", muscle_group: "Triceps" },

  // Quadriceps
  { name: "Squat", muscle_group: "Quadriceps" },
  { name: "Leg Press", muscle_group: "Quadriceps" },
  { name: "Leg Extension", muscle_group: "Quadriceps" },
  { name: "Lunges", muscle_group: "Quadriceps" },
  { name: "Bulgarian Split Squat", muscle_group: "Quadriceps" },
  { name: "Hack Squat", muscle_group: "Quadriceps" },
  { name: "Front Squat", muscle_group: "Quadriceps" },
  { name: "Goblet Squat", muscle_group: "Quadriceps" },

  // Hamstrings
  { name: "Romanian Deadlift", muscle_group: "Hamstrings" },
  { name: "Leg Curl", muscle_group: "Hamstrings" },
  { name: "Stiff-Leg Deadlift", muscle_group: "Hamstrings" },
  { name: "Good Mornings", muscle_group: "Hamstrings" },
  { name: "Nordic Curl", muscle_group: "Hamstrings" },
  { name: "Seated Leg Curl", muscle_group: "Hamstrings" },

  // Glutes
  { name: "Hip Thrust", muscle_group: "Glutes" },
  { name: "Glute Bridge", muscle_group: "Glutes" },
  { name: "Cable Kickback", muscle_group: "Glutes" },
  { name: "Sumo Deadlift", muscle_group: "Glutes" },
  { name: "Step-Ups", muscle_group: "Glutes" },
  { name: "Donkey Kicks", muscle_group: "Glutes" },

  // Core
  { name: "Plank", muscle_group: "Core" },
  { name: "Crunch", muscle_group: "Core" },
  { name: "Hanging Leg Raise", muscle_group: "Core" },
  { name: "Russian Twist", muscle_group: "Core" },
  { name: "Cable Woodchop", muscle_group: "Core" },
  { name: "Ab Wheel Rollout", muscle_group: "Core" },
  { name: "Mountain Climbers", muscle_group: "Core" },

  // Calves
  { name: "Standing Calf Raise", muscle_group: "Calves" },
  { name: "Seated Calf Raise", muscle_group: "Calves" },
  { name: "Donkey Calf Raise", muscle_group: "Calves" },
  { name: "Single Leg Calf Raise", muscle_group: "Calves" },

  // Forearms
  { name: "Wrist Curl", muscle_group: "Forearms" },
  { name: "Reverse Wrist Curl", muscle_group: "Forearms" },
  { name: "Farmer's Walk", muscle_group: "Forearms" },
  { name: "Reverse Curl", muscle_group: "Forearms" },
];

export const MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps",
  "Quadriceps", "Hamstrings", "Glutes", "Core", "Calves", "Forearms",
];

export const getExercisesByMuscle = (muscle: string) =>
  EXERCISE_LIBRARY.filter((e) => e.muscle_group === muscle);
