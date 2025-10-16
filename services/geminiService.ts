import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { Recipe, WeeklyPlan, UserProfile, FoodAnalysis, NutritionalAnalysis, WorkoutPlan } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development. In a real environment, the key would be set.
  console.warn("API_KEY no está configurada. Las llamadas a la API fallarán.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    recipeName: { type: Type.STRING, description: "Nombre de la receta" },
    description: { type: Type.STRING, description: "Breve descripción de la receta" },
    ingredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de ingredientes con cantidades"
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Pasos para preparar la receta. Deben ser claros, fáciles de seguir y estar bien explicados."
    },
    prepTime: { type: Type.STRING, description: "Tiempo total de preparación" }
  },
  required: ["recipeName", "description", "ingredients", "instructions", "prepTime"]
};

export const generateRecipes = async (prompt: string, count: number = 2): Promise<Recipe[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Genera ${count} ${count > 1 ? 'recetas' : 'receta'} basadas en este prompt: "${prompt}". Busca ofrecer variedad y no te limites a ingredientes comunes como el salmón. Asegúrate de que sean adecuadas para personas con diabetes e hipertensión. Las instrucciones deben ser claras, fáciles de entender y bien explicadas. Responde en español.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: recipeSchema
        }
      }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as Recipe[];
  } catch (error) {
    console.error("Error generando recetas:", error);
    return [];
  }
};

export const analyzeFoodImage = async (base64Image: string, mimeType: string, userProfile: UserProfile): Promise<FoodAnalysis | string> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      },
    };
    const textPart = {
      text: `Analiza esta imagen de comida. Eres un experto en nutrición. Tu respuesta DEBE estar en formato JSON. Identifica los alimentos en la imagen con sus pesos estimados. Estima el total de calorías y los gramos de macronutrientes (proteínas, carbohidratos, grasas). Luego, proporciona un feedback detallado para un usuario con el siguiente perfil: condición de salud: ${userProfile.condition}, objetivo: "${userProfile.goal}". El feedback debe incluir: 1) un análisis de la composición de la comida, 2) una recomendación unificada y detallada, y 3) un campo booleano 'isRecommended' que sea 'true' si la comida es generalmente recomendable, o 'false' si no lo es o se debe consumir con mucha precaución. Responde en español.`
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    totalCalories: { type: Type.NUMBER, description: "Total de kilocalorías estimadas." },
                    macros: {
                        type: Type.OBJECT,
                        properties: {
                            protein: { type: Type.NUMBER, description: "Gramos de proteína." },
                            carbs: { type: Type.NUMBER, description: "Gramos de carbohidratos." },
                            fat: { type: Type.NUMBER, description: "Gramos de grasa." },
                        },
                        required: ["protein", "carbs", "fat"]
                    },
                    identifiedFoods: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Lista de alimentos identificados en la imagen, incluyendo pesos estimados. Ej: 'Pechuga de pollo (150g)'"
                    },
                    feedback: {
                        type: Type.OBJECT,
                        properties: {
                            compositionAnalysis: { type: Type.STRING, description: "Análisis de la composición general de la comida." },
                            recommendation: { type: Type.STRING, description: "Recomendación unificada para la meta del usuario, basada principalmente en su condición de salud." },
                            isRecommended: { type: Type.BOOLEAN, description: "True si la comida es recomendable para el usuario, False si no lo es." }
                        },
                        required: ["compositionAnalysis", "recommendation", "isRecommended"]
                    }
                },
                required: ["totalCalories", "macros", "identifiedFoods", "feedback"]
            }
        }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as FoodAnalysis;
  } catch (error) {
    console.error("Error analizando imagen:", error);
    return "No se pudo analizar la imagen. Inténtalo de nuevo.";
  }
};

export const getAiChatResponse = async (message: string, userProfile: UserProfile): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
            systemInstruction: `Eres NutriLife, un asistente de IA amigable y experto en nutrición. Estás ayudando a ${userProfile.name}, quien tiene ${userProfile.condition} y su objetivo principal es "${userProfile.goal}". Sé motivador, claro y proporciona consejos seguros y basados en evidencia que sean específicamente relevantes para ${userProfile.name} y sus condiciones/objetivos. Responde siempre en español.`,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error en el chat de IA:", error);
    return "Lo siento, estoy teniendo problemas para conectarme. Por favor, intenta más tarde.";
  }
};

export const generateWeeklyPlan = async (profile: string, days: number, preferences: string): Promise<WeeklyPlan | null> => {
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const requestedDays = daysOfWeek.slice(0, days);

    const prompt = `Crea un plan de comidas de ${days} días (${requestedDays.join(', ')}) para una persona con el siguiente perfil: ${profile}. ${preferences ? `Ten en cuenta estas preferencias y alergias: "${preferences}".` : ''} Para cada día, proporciona 5 recetas (desayuno, colación de mañana, almuerzo, colación de tarde y cena). Las colaciones deben ser meriendas ligeras y saludables. Cada receta DEBE incluir: nombre, descripción, ingredientes, instrucciones de preparación claras y fáciles de entender, y tiempo de preparación. El plan debe ser simple, saludable, variado, y específicamente diseñado para alguien con las condiciones de salud mencionadas, enfocado en controlar la glucosa y el sodio. Evita repetir ingredientes principales con demasiada frecuencia. Responde en español.`;
    
    const mealSchema = { 
        type: Type.OBJECT, 
        properties: { 
            desayuno: recipeSchema,
            colacion_manana: recipeSchema,
            almuerzo: recipeSchema,
            colacion_tarde: recipeSchema,
            cena: recipeSchema,
        },
        required: ["desayuno", "colacion_manana", "almuerzo", "colacion_tarde", "cena"]
    };

    const dynamicProperties = requestedDays.reduce((acc, day) => {
        acc[day] = mealSchema;
        return acc;
    }, {} as { [key: string]: typeof mealSchema });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: dynamicProperties,
                    required: requestedDays
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as WeeklyPlan;
    } catch (error) {
        console.error("Error generando plan semanal:", error);
        return null;
    }
};

export const calculateNutrition = async (text: string, userProfile: UserProfile): Promise<NutritionalAnalysis | string> => {
    const prompt = `Calcula la información nutricional para lo siguiente: "${text}". Eres un experto en nutrición. Tu respuesta DEBE estar en formato JSON. Estima el total de calorías, los gramos de macronutrientes (proteínas, carbohidratos, grasas) y los gramos de azúcares. Luego, proporciona un feedback detallado para un usuario con el siguiente perfil: condición de salud: ${userProfile.condition}, objetivo: "${userProfile.goal}". El feedback debe incluir: 1) un análisis de la composición de la comida, 2) una recomendación detallada, y 3) un campo booleano 'isRecommended' que sea 'true' si la comida es generalmente recomendable, o 'false' si no lo es o se debe consumir con mucha precaución. Responde en español.`
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        totalCalories: { type: Type.NUMBER, description: "Total de kilocalorías estimadas." },
                        macros: {
                            type: Type.OBJECT,
                            properties: {
                                protein: { type: Type.NUMBER, description: "Gramos de proteína." },
                                carbs: { type: Type.NUMBER, description: "Gramos de carbohidratos." },
                                fat: { type: Type.NUMBER, description: "Gramos de grasa." },
                            },
                            required: ["protein", "carbs", "fat"]
                        },
                        sugars: { type: Type.NUMBER, description: "Gramos de azúcares totales." },
                        feedback: {
                            type: Type.OBJECT,
                            properties: {
                                compositionAnalysis: { type: Type.STRING, description: "Análisis de la composición general de la comida." },
                                recommendation: { type: Type.STRING, description: "Recomendación unificada para la meta del usuario, basada principalmente en su condición de salud." },
                                isRecommended: { type: Type.BOOLEAN, description: "True si la comida es recomendable para el usuario, False si no lo es." }
                            },
                            required: ["compositionAnalysis", "recommendation", "isRecommended"]
                        }
                    },
                    required: ["totalCalories", "macros", "sugars", "feedback"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as NutritionalAnalysis;
    } catch(error) {
        console.error("Error calculando nutrición:", error);
        return "No se pudo realizar el cálculo. Inténtalo de nuevo con una descripción más clara.";
    }
};

const workoutSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Nombre del ejercicio." },
        sets: { type: Type.STRING, description: "Número de series. Ej: '3'" },
        repetitions: { type: Type.STRING, description: "Número de repeticiones o duración. Ej: '10-12' o '30 segundos'" },
        description: { type: Type.STRING, description: "Breve descripción de cómo realizar el ejercicio correctamente." },
        rest: { type: Type.STRING, description: "Tiempo de descanso entre series. Ej: '60 segundos'" }
    },
    required: ["name", "sets", "repetitions", "description", "rest"]
};

export const generateWorkoutPlan = async (userProfile: UserProfile, focus: string, days: number): Promise<WorkoutPlan | null> => {
    const daysOfWeek = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'];
    const requestedDays = daysOfWeek.slice(0, days);

    const prompt = `
    Crea un plan de entrenamiento físico de ${days} días para un usuario con el siguiente perfil:
    - Edad: ${userProfile.age}
    - Condición de salud: ${userProfile.condition}
    - Objetivo de salud: "${userProfile.goal}"
    - Nivel de actividad física: ${userProfile.activityLevel}

    El enfoque principal de la rutina debe ser: "${focus}".

    **REGLAS CRÍTICAS DE SEGURIDAD:**
    1.  El plan DEBE ser seguro para alguien con ${userProfile.condition}. Prioriza ejercicios de bajo impacto. Evita ejercicios de alta intensidad, levantamiento de pesas pesadas o movimientos que puedan causar picos de presión arterial.
    2.  Incluye siempre un calentamiento ligero antes de cada sesión y un estiramiento suave al finalizar. Describe estos como parte de la rutina.
    3.  El plan debe ser realista para alguien con un nivel de actividad ${userProfile.activityLevel}.
    4.  Crea un plan para ${days} días distintos. Nombra los días como "Día 1", "Día 2", etc.
    5.  Para cada día, proporciona una lista de 4 a 6 ejercicios.
    6.  Incluye una lista de al menos 3 recomendaciones de seguridad generales e importantes, específicas para el ejercicio con ${userProfile.condition}. Por ejemplo, "Mide tu glucosa antes y después de entrenar" o "Mantente siempre hidratado".

    Responde en español.
    `;

    const dynamicScheduleProperties = requestedDays.reduce((acc, day) => {
        acc[day] = {
            type: Type.ARRAY,
            items: workoutSchema
        };
        return acc;
    }, {} as { [key: string]: any });


    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        planName: { type: Type.STRING, description: "Un nombre motivador para el plan de entrenamiento. Ej: 'Plan de Inicio Activo'" },
                        focus: { type: Type.STRING, description: "El enfoque principal del plan. Ej: 'Fortalecimiento de bajo impacto'" },
                        duration: { type: Type.STRING, description: `La duración del plan en días. Ej: '${days} días'` },
                        schedule: {
                            type: Type.OBJECT,
                            properties: dynamicScheduleProperties,
                            required: requestedDays,
                        },
                        recommendations: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Lista de recomendaciones de seguridad importantes."
                        }
                    },
                    required: ["planName", "focus", "duration", "schedule", "recommendations"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as WorkoutPlan;
    } catch (error) {
        console.error("Error generando plan de entrenamiento:", error);
        return null;
    }
};