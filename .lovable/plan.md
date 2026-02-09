

# FitTrack - Gym Workout Tracker MVP

A dark, bold-themed fitness app where users can track workouts, log progress, and get AI-generated training plans based on their profile and goals.

---

## 1. Authentication & Roles
- **Login/Signup page** with email and password
- Two roles: **Admin** and **Student** (default)
- Admin role assigned manually (you) via a roles table in the database

## 2. User Onboarding Profile
- After first login, users complete a profile setup:
  - **Gender** (Male / Female)
  - **Height** and **Initial Weight**
- Profile page where users can **update current weight** and see a comparison with their starting weight
- Weight history log with date entries

## 3. Workout Generation (AI-Powered)
- Users choose a goal: **Fat Burning** or **Hypertrophy**
- AI generates a personalized workout plan using Lovable AI, taking into account:
  - Gender-specific splits:
    - **Men**: A (Chest, Triceps, Shoulders) / B (Back, Biceps) / C (Full Legs)
    - **Women**: A (Quadriceps) / B (Chest, Triceps, Shoulders) / C (Back, Biceps) / D (Hamstrings & Glutes)
  - Suggested minimum of 10 reps per exercise
- Workouts organized by **sessions (A, B, C, D)** with exercises listed per session

## 4. Custom Workout Builder
- Users can create their own workouts manually
- Exercise categories: **Legs** (Quadriceps / Hamstrings), **Back**, **Chest**, **Shoulders**, **Biceps**, **Triceps**, **Forearms**
- Add exercises to sessions, organized by muscle group

## 5. Workout Logging & Tracking
- Users tap on an exercise within a session to log:
  - **Reps completed**
  - **Weight/load used**
- History of past logs per exercise for tracking progression

## 6. Progress Dashboard
- Users can toggle between:
  - **Log history view**: table/list of past workout entries with weights and reps
  - **Charts view**: visual graphs showing weight evolution (body weight) and strength progress over time (using Recharts)

## 7. Admin Dashboard
- **View all registered students** and their profiles (gender, weight, goals)
- **Manage preset workouts**: create, edit, and organize the AI-generated templates
- Overview of student activity

## 8. Design & UX
- **Dark theme** with bold accent colors (fitness/gym aesthetic)
- Mobile-first responsive design
- Clean navigation with bottom tabs or sidebar

---

## Tech Stack
- **Frontend**: React + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Lovable Cloud (Supabase) for auth, database, and edge functions
- **AI**: Lovable AI (Gemini) for workout plan generation

