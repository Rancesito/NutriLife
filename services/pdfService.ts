import jsPDF from 'jspdf';
import type { Recipe, WeeklyPlan, UserProfile, WorkoutPlan } from '../types';

const addWrappedText = (doc: jsPDF, text: string | string[], x: number, y: number, maxWidth: number, lineHeight: number, isTitle: boolean = false) => {
    if (isTitle) {
        doc.setFont('helvetica', 'bold');
    } else {
        doc.setFont('helvetica', 'normal');
    }

    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    const newY = y + (lines.length * lineHeight);
    return newY;
};

const checkPageBreak = (doc: jsPDF, currentY: number, margin: number, pageHeight: number) => {
    if (currentY > pageHeight - margin) {
        doc.addPage();
        return margin;
    }
    return currentY;
};

export const downloadRecipeAsPDF = (recipe: Recipe) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let y = margin;

    doc.setFontSize(22);
    y = addWrappedText(doc, recipe.recipeName, margin, y, 170, 10, true);
    y += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    y = addWrappedText(doc, recipe.description, margin, y, 170, 6, false);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Tiempo de preparación: ${recipe.prepTime}`, margin, y);
    y += 10;

    doc.setLineWidth(0.5);
    doc.line(margin, y - 5, 190, y - 5);

    doc.setFontSize(16);
    y = addWrappedText(doc, 'Ingredientes', margin, y, 170, 8, true);
    y += 5;

    doc.setFontSize(11);
    recipe.ingredients.forEach(ingredient => {
        y = checkPageBreak(doc, y, margin, pageHeight);
        y = addWrappedText(doc, `- ${ingredient}`, margin, y, 170, 6);
    });
    y += 10;

    y = checkPageBreak(doc, y, margin, pageHeight);
    doc.setFontSize(16);
    y = addWrappedText(doc, 'Instrucciones', margin, y, 170, 8, true);
    y += 5;

    doc.setFontSize(11);
    recipe.instructions.forEach((step, index) => {
        y = checkPageBreak(doc, y, margin, pageHeight);
        y = addWrappedText(doc, `${index + 1}. ${step}`, margin, y, 170, 6);
        y += 4;
    });

    doc.save(`${recipe.recipeName.replace(/\s/g, '_')}.pdf`);
};

export const downloadWeeklyPlanAsPDF = (plan: WeeklyPlan, userProfile: UserProfile) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let y = margin;

    doc.setFontSize(22);
    y = addWrappedText(doc, `Plan Nutricional Completo para ${userProfile.name}`, margin, y, 170, 10, true);
    y += 10;

    Object.entries(plan).forEach(([day, meals], dayIndex) => {
        y = checkPageBreak(doc, y, margin, pageHeight);
        
        doc.setFontSize(18);
        y = addWrappedText(doc, day, margin, y, 170, 8, true);
        y += 8;

        const typedMeals = meals as WeeklyPlan[string];
        const mealOrder: Array<[string, Recipe]> = [
            ['Desayuno', typedMeals.desayuno],
            ['Colación Mañana', typedMeals.colacion_manana],
            ['Almuerzo', typedMeals.almuerzo],
            ['Colación Tarde', typedMeals.colacion_tarde],
            ['Cena', typedMeals.cena]
        ];

        mealOrder.forEach(([mealType, recipe]) => {
            y = checkPageBreak(doc, y, margin, pageHeight);
            
            doc.setFontSize(16);
            y = addWrappedText(doc, `${mealType}: ${recipe.recipeName}`, margin + 5, y, 165, 7, true);

            y = checkPageBreak(doc, y, margin, pageHeight);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text(`Tiempo: ${recipe.prepTime}`, margin + 5, y);
            y += 8;

            // Ingredients
            y = checkPageBreak(doc, y, margin, pageHeight);
            doc.setFontSize(12);
            y = addWrappedText(doc, 'Ingredientes:', margin + 10, y, 160, 6, true);
            y += 2;
            doc.setFontSize(10);
            recipe.ingredients.forEach(ingredient => {
                y = checkPageBreak(doc, y, margin, pageHeight);
                y = addWrappedText(doc, `- ${ingredient}`, margin + 10, y, 160, 5);
            });
            y += 6;

            // Instructions
            y = checkPageBreak(doc, y, margin, pageHeight);
            doc.setFontSize(12);
            y = addWrappedText(doc, 'Instrucciones:', margin + 10, y, 160, 6, true);
            y += 2;
            doc.setFontSize(10);
            recipe.instructions.forEach((step, index) => {
                y = checkPageBreak(doc, y, margin, pageHeight);
                y = addWrappedText(doc, `${index + 1}. ${step}`, margin + 10, y, 160, 5);
                y += 2;
            });
            y += 8;
        });

        if (dayIndex < Object.keys(plan).length - 1) {
            y = checkPageBreak(doc, y, margin, pageHeight);
            doc.setLineWidth(0.2);
            doc.line(margin, y, 190, y);
            y += 8;
        }
    });

    doc.save('plan_nutricional_semanal_completo.pdf');
};


export const downloadWorkoutPlanAsPDF = (plan: WorkoutPlan) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let y = margin;

    doc.setFontSize(22);
    y = addWrappedText(doc, plan.planName, margin, y, 170, 10, true);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'italic');
    y = addWrappedText(doc, `${plan.focus} - ${plan.duration}`, margin, y, 170, 7);
    y += 10;

    doc.setLineWidth(0.5);
    doc.line(margin, y - 5, 190, y - 5);

    doc.setFontSize(16);
    y = addWrappedText(doc, 'Recomendaciones de Seguridad', margin, y, 170, 8, true);
    y += 5;

    doc.setFontSize(11);
    plan.recommendations.forEach(rec => {
        y = checkPageBreak(doc, y, margin, pageHeight);
        y = addWrappedText(doc, `- ${rec}`, margin, y, 170, 6);
    });
    y += 10;

    Object.entries(plan.schedule).forEach(([day, workouts]) => {
        y = checkPageBreak(doc, y, margin, pageHeight);
        doc.setFontSize(18);
        y = addWrappedText(doc, day, margin, y, 170, 8, true);
        y += 8;

        (workouts as any[]).forEach(workout => {
            y = checkPageBreak(doc, y, margin, pageHeight);
            doc.setFontSize(14);
            y = addWrappedText(doc, workout.name, margin + 5, y, 165, 7, true);
            
            doc.setFontSize(10);
            y = addWrappedText(doc, `Series: ${workout.sets} | Reps: ${workout.repetitions} | Descanso: ${workout.rest}`, margin + 5, y, 165, 5);
            y += 3;
            
            doc.setFontSize(11);
            y = addWrappedText(doc, workout.description, margin + 10, y, 160, 6);
            y += 8;
        });
    });

    doc.save(`${plan.planName.replace(/\s/g, '_')}.pdf`);
};