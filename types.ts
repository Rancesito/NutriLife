// FIX: Removed self-import of `Section`. A file should not import from itself.
export enum Section {
  WELCOME = 'welcome',
  ONBOARDING = 'onboarding',
  PERFIL = 'perfil',
  MONITOREO = 'monitoreo',
  HABITOS = 'habitos',
  SCANNER = 'scanner',
  CALCULADORA = 'calculadora',
  RECETAS = 'recetas',
  MIS_RECETAS = 'mis_recetas',
  PLAN_SEMANAL = 'plan_semanal',
  COACH = 'coach',
  CHAT = 'chat'
}

export interface UserProfile {
  name: string;
  condition: 'diabetes' | 'hipertension' | 'ambas';
  goal: string;
  gender: 'male' | 'female' | 'other';
  age: number | '';
  weight: number | '';
  height: number | '';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  plan: 'free' | 'premium';
}

export interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
}

export interface WeeklyPlan {
  [day: string]: {
    desayuno: Recipe;
    colacion_manana: Recipe;
    almuerzo: Recipe;
    colacion_tarde: Recipe;
    cena: Recipe;
  };
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface FoodAnalysis {
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  identifiedFoods: string[];
  feedback: {
    compositionAnalysis: string;
    recommendation: string;
    isRecommended: boolean;
  };
}

export interface NutritionalAnalysis {
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  sugars: number;
  feedback: {
    compositionAnalysis: string;
    recommendation: string;
    isRecommended: boolean;
  };
}

export interface Habit {
  id: number;
  text: string;
  completed: boolean;
}

export interface Workout {
  name: string;
  sets: string;
  repetitions: string;
  description: string;
  rest: string;
}

export interface WorkoutPlan {
  planName: string;
  focus: string;
  duration: string;
  schedule: {
    [day: string]: Workout[];
  };
  recommendations: string[];
}