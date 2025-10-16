import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { UserProfile, Recipe, WeeklyPlan, ChatMessage, FoodAnalysis, NutritionalAnalysis, Habit, WorkoutPlan, Workout } from '../types';
import { GlassCard } from './ui/GlassCard';
import { Loader, TextLoader } from './ui/Loader';
import { SendIcon, TrashIcon, StarIcon, PlanIcon, SparklesIcon, CoachIcon, DownloadIcon, CrownIcon, GoogleIcon } from './Icons';
import { generateRecipes, analyzeFoodImage, getAiChatResponse, generateWeeklyPlan, calculateNutrition, generateWorkoutPlan } from '../services/geminiService';
import { downloadRecipeAsPDF, downloadWeeklyPlanAsPDF, downloadWorkoutPlanAsPDF } from '../services/pdfService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import type { User } from '../services/firebaseService';

// --- Reusable Recipe Modal ---
const RecipeModal: React.FC<{ recipe: Recipe; onClose: () => void, onSave?: (recipe: Recipe) => void }> = ({ recipe, onClose, onSave }) => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
        <GlassCard className="p-6 md:p-8 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
                 <h2 className="text-2xl md:text-3xl font-bold text-gray-800 pr-4">{recipe.recipeName}</h2>
                 <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200/50 transition-colors flex-shrink-0 -mt-2 -mr-2" aria-label="Cerrar modal">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
            </div>
            <p className="text-gray-600 mb-2 italic">{recipe.description}</p>
            <p className="text-sm text-gray-700 mb-6"><strong>Tiempo de preparación:</strong> {recipe.prepTime}</p>
            
            <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-700">Ingredientes</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-700">Instrucciones</h3>
                        <ol className="list-decimal list-inside space-y-3 text-gray-600 leading-relaxed">
                            {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/30 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                    onClick={() => downloadRecipeAsPDF(recipe)} 
                    className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                    <DownloadIcon /> PDF
                </button>
                {onSave && (
                    <button onClick={() => { onSave(recipe); onClose(); }} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Guardar Receta</button>
                )}
            </div>
        </GlassCard>
    </div>
);


// --- Welcome View ---
export const WelcomeView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
    <GlassCard className="text-center p-8 sm:p-12 max-w-lg mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Bienvenido a NutriLife AI</h1>
        <p className="text-base sm:text-lg text-gray-600 mb-8">Tu asistente de nutrición inteligente. Inicia sesión para crear tu plan personalizado.</p>
        <button 
            onClick={onLogin} 
            className="bg-white text-gray-700 font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mx-auto"
        >
            <GoogleIcon />
            <span>Iniciar Sesión con Google</span>
        </button>
    </GlassCard>
);

// --- Onboarding View ---
export const OnboardingView: React.FC<{ onComplete: (profile: Omit<UserProfile, 'plan'>) => void; firebaseUser: User; }> = ({ onComplete, firebaseUser }) => {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState<Omit<UserProfile, 'plan'>>({
        name: firebaseUser.displayName || '',
        condition: 'diabetes',
        goal: '',
        gender: 'male',
        age: '',
        weight: '',
        height: '',
        activityLevel: 'sedentary'
    });

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 5) setStep(step + 1);
        else onComplete(profile);
    };

    const inputClass = "w-full p-3 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800";
    const labelClass = "block text-lg font-semibold mb-2 text-gray-800";
    const subLabelClass = "block text-sm font-medium mb-1 text-gray-700 mt-4";

    return (
        <GlassCard className="p-6 sm:p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-center mb-4">Crea tu Perfil</h2>
            <form onSubmit={handleNext}>
                {step === 1 && (
                    <div className="animate-fade-in">
                        <label className={labelClass}>Hola 👋, ¿cómo te llamamos?</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                            className={inputClass}
                            placeholder="Escribe tu nombre"
                            required
                        />
                    </div>
                )}
                {step === 2 && (
                     <div className="animate-fade-in">
                        <label className={labelClass}>¿Tienes alguna de estas condiciones?</label>
                        <select
                            value={profile.condition}
                            onChange={e => setProfile({ ...profile, condition: e.target.value as UserProfile['condition'] })}
                            className={inputClass}
                        >
                            <option value="diabetes">Diabetes</option>
                            <option value="hipertension">Hipertensión</option>
                            <option value="ambas">Ambas</option>
                        </select>
                    </div>
                )}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <label className={labelClass}>¿Cuál es tu principal objetivo de salud?</label>
                         <input
                            type="text"
                            value={profile.goal}
                            onChange={e => setProfile({ ...profile, goal: e.target.value })}
                            className={inputClass}
                            placeholder="Ej: Perder peso, controlar glucosa..."
                            required
                        />
                    </div>
                )}
                {step === 4 && (
                    <div className="animate-fade-in">
                        <label className={labelClass}>Cuéntanos un poco sobre ti</label>
                        
                        <label className={subLabelClass}>Género</label>
                        <select
                            value={profile.gender}
                            onChange={e => setProfile({ ...profile, gender: e.target.value as UserProfile['gender'] })}
                            className={inputClass}
                        >
                            <option value="male">Masculino</option>
                            <option value="female">Femenino</option>
                            <option value="other">Prefiero no decirlo</option>
                        </select>

                        <label className={subLabelClass}>Edad</label>
                        <input
                            type="number"
                            value={profile.age}
                            onChange={e => setProfile({ ...profile, age: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className={inputClass}
                            placeholder="Ej. 25"
                            min="1"
                            required
                        />

                        <label className={subLabelClass}>Peso (kg)</label>
                        <input
                            type="number"
                            value={profile.weight}
                            onChange={e => setProfile({ ...profile, weight: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className={inputClass}
                            placeholder="Ej. 65"
                            min="1"
                            required
                        />

                        <label className={subLabelClass}>Altura (cm)</label>
                        <input
                            type="number"
                            value={profile.height}
                            onChange={e => setProfile({ ...profile, height: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className={inputClass}
                            placeholder="Ej. 170"
                            min="1"
                            required
                        />
                    </div>
                )}
                {step === 5 && (
                    <div className="animate-fade-in">
                        <label className={labelClass}>¿Cuál es tu nivel de actividad física?</label>
                        <select
                            value={profile.activityLevel}
                            onChange={e => setProfile({ ...profile, activityLevel: e.target.value as UserProfile['activityLevel'] })}
                            className={inputClass}
                        >
                            <option value="sedentary">Sedentario (poco o nada de ejercicio)</option>
                            <option value="light">Ligero (ejercicio 1-3 días/semana)</option>
                            <option value="moderate">Moderado (ejercicio 3-5 días/semana)</option>
                            <option value="active">Activo (ejercicio 6-7 días/semana)</option>
                            <option value="very_active">Muy activo (trabajo físico o ejercicio intenso)</option>
                        </select>
                    </div>
                )}
                <button type="submit" className="w-full mt-6 bg-blue-500 text-white font-bold py-3 px-6 rounded-full hover:bg-blue-600 transition-all duration-300">
                    {step < 5 ? 'Siguiente' : 'Finalizar'}
                </button>
            </form>
        </GlassCard>
    );
};

// --- Profile View ---
interface ProfileViewProps {
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
    onUpgradeClick: () => void;
    onSignOut: () => void;
}
export const ProfileView: React.FC<ProfileViewProps> = ({ userProfile, onUpdateProfile, onUpgradeClick, onSignOut }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableProfile, setEditableProfile] = useState<UserProfile>(userProfile);
    
    useEffect(() => {
        setEditableProfile(userProfile);
    }, [userProfile]);

    const handleSave = () => {
        onUpdateProfile(editableProfile);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableProfile(userProfile);
        setIsEditing(false);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditableProfile(prev => ({
            ...prev,
            [name]: (name === 'age' || name === 'weight' || name === 'height') && value !== '' ? parseInt(value) : value,
        }));
    };

    const profileData = [
        { label: 'Condición Principal', value: userProfile.condition === 'ambas' ? 'Diabetes e Hipertensión' : userProfile.condition.charAt(0).toUpperCase() + userProfile.condition.slice(1) },
        { label: 'Objetivo de Salud', value: userProfile.goal },
        { label: 'Género', value: userProfile.gender === 'male' ? 'Masculino' : userProfile.gender === 'female' ? 'Femenino' : 'No especificado' },
        { label: 'Edad', value: `${userProfile.age} años` },
        { label: 'Peso', value: `${userProfile.weight} kg` },
        { label: 'Altura', value: `${userProfile.height} cm` },
        { label: 'Nivel de Actividad', value: userProfile.activityLevel.charAt(0).toUpperCase() + userProfile.activityLevel.slice(1) },
    ];
    
    const inputClass = "w-full p-3 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800";
    const labelClass = "block text-sm font-semibold mb-1 text-gray-600";

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
            <p className="text-lg text-gray-600 mb-8">
                {isEditing 
                    ? "Actualiza tu información para mantener tus planes y recomendaciones al día." 
                    : "Esta es la información que NutriLife AI utiliza para personalizar tu experiencia."}
            </p>
            
            <GlassCard className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                            {editableProfile.name.charAt(0).toUpperCase()}
                        </div>
                        {isEditing ? (
                             <div className="w-full">
                                <label className={labelClass}>Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editableProfile.name}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        ) : (
                            <div className="text-center sm:text-left">
                                <h2 className="text-3xl md:text-4xl font-bold">{userProfile.name}</h2>
                                <p className="text-lg md:text-xl text-gray-600">{userProfile.goal}</p>
                            </div>
                        )}
                    </div>
                     {userProfile.plan === 'free' ? (
                        <button onClick={onUpgradeClick} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0">
                            <CrownIcon /> <span>Upgrade a Premium</span>
                        </button>
                    ) : (
                        <div className="w-full sm:w-auto flex items-center justify-center gap-2 text-yellow-600 font-bold bg-yellow-500/20 py-2 px-4 rounded-lg flex-shrink-0">
                            <CrownIcon /> <span>Plan Premium Activo</span>
                        </div>
                    )}
                </div>
                
                {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Condición Principal</label>
                            <select name="condition" value={editableProfile.condition} onChange={handleChange} className={inputClass}>
                                <option value="diabetes">Diabetes</option>
                                <option value="hipertension">Hipertensión</option>
                                <option value="ambas">Ambas</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Objetivo de Salud</label>
                            <input type="text" name="goal" value={editableProfile.goal} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Género</label>
                            <select name="gender" value={editableProfile.gender} onChange={handleChange} className={inputClass}>
                                <option value="male">Masculino</option>
                                <option value="female">Femenino</option>
                                <option value="other">Prefiero no decirlo</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Edad</label>
                            <input type="number" name="age" value={editableProfile.age} onChange={handleChange} className={inputClass} min="1" />
                        </div>
                         <div>
                            <label className={labelClass}>Peso (kg)</label>
                            <input type="number" name="weight" value={editableProfile.weight} onChange={handleChange} className={inputClass} min="1" />
                        </div>
                        <div>
                            <label className={labelClass}>Altura (cm)</label>
                            <input type="number" name="height" value={editableProfile.height} onChange={handleChange} className={inputClass} min="1" />
                        </div>
                        <div className="md:col-span-2">
                             <label className={labelClass}>Nivel de Actividad</label>
                             <select name="activityLevel" value={editableProfile.activityLevel} onChange={handleChange} className={inputClass}>
                                <option value="sedentary">Sedentario (poco o nada de ejercicio)</option>
                                <option value="light">Ligero (ejercicio 1-3 días/semana)</option>
                                <option value="moderate">Moderado (ejercicio 3-5 días/semana)</option>
                                <option value="active">Activo (ejercicio 6-7 días/semana)</option>
                                <option value="very_active">Muy activo (trabajo físico o ejercicio intenso)</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profileData.map(item => (
                            <div key={item.label} className="bg-white/50 p-4 rounded-lg shadow-sm">
                                <p className="text-sm font-semibold text-gray-500">{item.label}</p>
                                <p className="text-lg text-gray-800 font-medium">{item.value}</p>
                            </div>
                        ))}
                    </div>
                )}
                 <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
                    {isEditing ? (
                        <>
                            <button onClick={handleCancel} className="bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full hover:bg-gray-400 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-colors">
                                Guardar Cambios
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onSignOut} className="bg-red-500 text-white font-bold py-2 px-6 rounded-full hover:bg-red-600 transition-colors">
                                Cerrar Sesión
                            </button>
                            <button onClick={() => setIsEditing(true)} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-colors">
                                Editar Perfil
                            </button>
                        </>
                    )}
                </div>
            </GlassCard>
        </div>
    );
};

// --- Dashboard View ---
export const DashboardView: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const notesStorageKey = `nutrilife_notes_${userProfile.name.replace(/\s+/g, '_')}`;

    const [notes, setNotes] = useState<{ [key: string]: string }>(() => {
        try {
            const savedNotes = window.localStorage.getItem(notesStorageKey);
            return savedNotes ? JSON.parse(savedNotes) : {};
        } catch (error) {
            console.error("Could not read notes from localStorage", error);
            return {};
        }
    });

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentNote, setCurrentNote] = useState('');

    const handleDateClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
        const dateKey = date.toISOString().split('T')[0];
        setCurrentNote(notes[dateKey] || '');
    };

    const handleSaveNote = () => {
        if (selectedDate) {
            const dateKey = selectedDate.toISOString().split('T')[0];
            const updatedNotes = { ...notes, [dateKey]: currentNote };
            setNotes(updatedNotes);
            try {
                window.localStorage.setItem(notesStorageKey, JSON.stringify(updatedNotes));
            } catch (error) {
                console.error("Could not save notes to localStorage", error);
            }
            setSelectedDate(null);
            setCurrentNote('');
        }
    };

    const handleCloseModal = () => {
        setSelectedDate(null);
        setCurrentNote('');
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-white/30 min-h-[4rem] sm:min-h-[6rem]"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = new Date(year, month, day).toISOString().split('T')[0];
        const hasNote = notes[dateKey] && notes[dateKey].trim() !== '';
        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

        calendarDays.push(
            <button 
                key={day} 
                onClick={() => handleDateClick(day)} 
                className="relative p-2 border-r border-b border-white/30 text-left align-top hover:bg-blue-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:z-10 min-h-[4rem] sm:min-h-[6rem]"
            >
                <span className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm sm:text-base ${isToday ? 'bg-blue-500 text-white font-bold' : ''}`}>
                    {day}
                </span>
                {hasNote && <div className="absolute bottom-2 right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full" title="Hay una nota"></div>}
            </button>
        );
    }

    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Monitoreo Diario</h1>
            <p className="text-lg text-gray-600 mb-8">Selecciona un día para añadir o editar una nota sobre tus comidas, síntomas o estado de ánimo.</p>
            
            <GlassCard className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200/50 transition-colors" aria-label="Mes anterior">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-700 text-center">{capitalizedMonthName} {year}</h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200/50 transition-colors" aria-label="Mes siguiente">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
                
                <div className="grid grid-cols-7 border-t border-l border-white/30">
                    {weekdays.map(day => (
                        <div key={day} className="text-center font-semibold text-xs sm:text-base p-2 border-r border-b border-white/30 text-gray-600 bg-white/30">
                            {day}
                        </div>
                    ))}
                    {calendarDays}
                </div>
            </GlassCard>

            {selectedDate && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={handleCloseModal}>
                    <GlassCard className="p-6 sm:p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Nota para el {selectedDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                        <textarea 
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                            className="w-full h-48 p-3 bg-white/80 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Añade aquí tus observaciones del día..."
                            autoFocus
                        />
                        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
                            <button onClick={handleCloseModal} className="bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full hover:bg-gray-400 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSaveNote} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-colors">
                                Guardar Nota
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};


// --- Habits View ---
interface HabitsViewProps {
    stars: number;
    onUpdateStars: (amount: number) => void;
    habits: Habit[];
    onUpdateHabits: (updatedHabits: Habit[]) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({ stars, onUpdateStars, habits, onUpdateHabits }) => {
    const [newHabit, setNewHabit] = useState('');

    const handleAddHabit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newHabit.trim() === '') return;

        const habitToAdd: Habit = {
            id: Date.now(),
            text: newHabit.trim(),
            completed: false,
        };

        onUpdateHabits([...habits, habitToAdd]);
        setNewHabit('');
    };
    
    const handleToggleHabit = (id: number) => {
        const habitToToggle = habits.find(h => h.id === id);
        if (!habitToToggle) return;

        const points = !habitToToggle.completed ? 1 : -1;
        onUpdateStars(points);

        onUpdateHabits(
            habits.map(habit =>
                habit.id === id ? { ...habit, completed: !habit.completed } : habit
            )
        );
    };

    const handleDeleteHabit = (id: number) => {
        const habitToDelete = habits.find(h => h.id === id);
        if (!habitToDelete) return;
    
        // Si el hábito estaba completado, no restamos la estrella.
        if (habitToDelete.completed) {
            // No hacemos nada con las estrellas
        }
    
        onUpdateHabits(habits.filter(habit => habit.id !== id));
    };

    return (
        <GlassCard className="p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                <h1 className="text-3xl font-bold">Registro de Hábitos</h1>
                <div className="flex items-center gap-2 text-2xl font-bold text-yellow-500" title={`${stars} estrellas ganadas`}>
                    <StarIcon />
                    <span>{stars}</span>
                </div>
            </div>
            <p className="text-lg text-gray-600 mb-6">Añade recordatorios y hábitos diarios para mantenerte en el camino correcto. ¡Gana una estrella por cada hábito completado!</p>

            <form onSubmit={handleAddHabit} className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                    type="text"
                    value={newHabit}
                    onChange={e => setNewHabit(e.target.value)}
                    placeholder="Ej: Beber 2 litros de agua"
                    className="flex-grow p-3 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button type="submit" className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-all duration-300">
                    Añadir
                </button>
            </form>

            <div className="flex-grow overflow-y-auto">
                {habits.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <p>Aún no has añadido ningún hábito. ¡Empieza ahora!</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {habits.map(habit => (
                             <li key={habit.id} className={`flex items-center justify-between p-4 rounded-xl shadow-sm animate-fade-in transition-colors duration-300 ${habit.completed ? 'bg-green-100/60' : 'bg-white/60'}`}>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        id={`habit-${habit.id}`}
                                        checked={habit.completed}
                                        onChange={() => handleToggleHabit(habit.id)}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-400 cursor-pointer flex-shrink-0"
                                    />
                                    <label
                                        htmlFor={`habit-${habit.id}`}
                                        className={`cursor-pointer transition-all ${habit.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}
                                    >
                                        {habit.text}
                                    </label>
                                </div>
                                <button
                                    onClick={() => handleDeleteHabit(habit.id)}
                                    className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100/50 transition-colors"
                                    aria-label={`Borrar hábito: ${habit.text}`}
                                >
                                    <TrashIcon />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </GlassCard>
    );
};


// --- AI Scanner View ---
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const MacroCircle: React.FC<{
  label: string;
  value: number;
  color: string;
  totalCalories: number;
  kcalPerGram: number;
}> = ({ label, value, color, totalCalories, kcalPerGram }) => {
  const macroCalories = value * kcalPerGram;
  const percentage = totalCalories > 0 ? Math.round((macroCalories / totalCalories) * 100) : 0;

  const data = [
    { name: 'value', value: percentage },
    { name: 'remaining', value: 100 - percentage },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="w-28 h-28 sm:w-36 sm:h-36 relative">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="95%"
              startAngle={90}
              endAngle={450}
              dataKey="value"
              stroke="none"
              cornerRadius={10}
            >
              <Cell key="value" fill={color} />
              <Cell key="remaining" fill="#E9ECEF" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</span>
          <span className="text-xs sm:text-sm text-gray-500">g</span>
        </div>
      </div>
      <p className="mt-2 font-semibold text-gray-700">{label}</p>
    </div>
  );
};

// --- AI View Props & Helper ---
interface AIViewProps {
    userProfile: UserProfile;
    credits: number;
    handleConsumeCredit: (amount: number) => void;
    openUpgradeModal: () => void;
}

export const AIScannerView: React.FC<AIViewProps> = ({ userProfile, credits, handleConsumeCredit, openUpgradeModal }) => {
    const [analysis, setAnalysis] = useState<FoodAnalysis | string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setAnalysis(null);
            setImagePreview(URL.createObjectURL(file));
            try {
                const base64Image = await fileToBase64(file);
                const result = await analyzeFoodImage(base64Image, file.type, userProfile);
                setAnalysis(result);
                if (typeof result !== 'string') {
                    handleConsumeCredit(1);
                }
            } catch (error) {
                setAnalysis("Error al procesar la imagen. Inténtalo de nuevo.");
            } finally {
                setIsLoading(false);
                // Reset file input to allow selecting the same file again
                if(event.target) event.target.value = '';
            }
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const recommendationClasses = typeof analysis !== 'string' && analysis?.feedback.isRecommended
        ? { container: "bg-green-50/70 border-green-400", title: "text-green-800", text: "text-green-700" }
        : { container: "bg-red-50/70 border-red-400", title: "text-red-800", text: "text-red-700" };

    const creditCost = 1;
    const hasEnoughCredits = userProfile.plan === 'premium' || credits >= creditCost;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Escáner de Alimentos con IA</h1>
            <p className="text-lg text-gray-600 mb-8">Sube una foto de tu comida para obtener un análisis nutricional instantáneo y personalizado.</p>
            <GlassCard className="p-6 relative overflow-hidden">
                {analysis && typeof analysis !== 'string' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-fuchsia-200/30 rounded-full blur-3xl -z-10 animate-pulse"></div>
                )}
                <div className="flex flex-col items-center mb-6">
                    <input type="file" ref={fileInputRef} id="file-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isLoading} />
                    {hasEnoughCredits ? (
                        <button onClick={handleButtonClick} className={`cursor-pointer bg-blue-500 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-600 transition-all duration-300 shadow-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isLoading}>
                            {isLoading ? 'Analizando...' : 'Seleccionar Imagen'}
                        </button>
                    ) : (
                        <button onClick={openUpgradeModal} className="cursor-pointer bg-purple-500 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-600 transition-all duration-300 shadow-lg flex items-center gap-2">
                             <CrownIcon /> Upgrade para Escanear
                        </button>
                    )}
                </div>

                {isLoading && (
                    <div className="flex flex-col items-center">
                        {imagePreview && <img src={imagePreview} alt="Comida a analizar" className="rounded-lg shadow-md max-h-60 sm:max-h-80 mb-4 opacity-50" />}
                        <Loader />
                    </div>
                )}
                
                {!isLoading && analysis && (
                    <div className="animate-fade-in max-w-3xl mx-auto">
                        {typeof analysis === 'string' ? (
                            <p className="text-center text-red-500">{analysis}</p>
                        ) : (
                            <div className="space-y-8">
                                {imagePreview && (
                                    <div className="flex justify-center">
                                        <img src={imagePreview} alt="Comida analizada" className="rounded-2xl shadow-lg max-h-60 sm:max-h-80 object-cover" />
                                    </div>
                                )}
                                <div className="text-center">
                                    <span className="text-5xl sm:text-6xl font-bold text-gray-800">{analysis.totalCalories}</span>
                                    <span className="text-2xl sm:text-3xl font-medium text-gray-600 align-baseline ml-2">kcal</span>
                                </div>

                                <div className="flex justify-center items-center flex-wrap gap-x-4 sm:gap-x-12 gap-y-6">
                                    <MacroCircle label="Proteína" value={analysis.macros.protein} color="#3B82F6" totalCalories={analysis.totalCalories} kcalPerGram={4} />
                                    <MacroCircle label="Carbs" value={analysis.macros.carbs} color="#F59E0B" totalCalories={analysis.totalCalories} kcalPerGram={4} />
                                    <MacroCircle label="Grasa" value={analysis.macros.fat} color="#EF4444" totalCalories={analysis.totalCalories} kcalPerGram={9} />
                                </div>
                                
                                <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-200 backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Alimentos Identificados</h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                                        {analysis.identifiedFoods.map((food, i) => <li key={i}>{food}</li>)}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Feedback de NutriAI</h3>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-200 backdrop-blur-sm">
                                            <h4 className="font-semibold text-gray-700 mb-2">Análisis de la Composición</h4>
                                            <p className="text-gray-600 leading-relaxed">{analysis.feedback.compositionAnalysis}</p>
                                        </div>
                                        
                                        <div className={`${recommendationClasses.container} border-l-4 p-6 backdrop-blur-sm`}>
                                            <h4 className={`font-semibold mb-2 ${recommendationClasses.title}`}>Recomendación para tu Meta</h4>
                                            <p className={`leading-relaxed ${recommendationClasses.text}`}>{analysis.feedback.recommendation}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </GlassCard>
        </div>
    );
};


// --- Calculator View ---
export const CalculatorView: React.FC<AIViewProps> = ({ userProfile, credits, handleConsumeCredit, openUpgradeModal }) => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<NutritionalAnalysis | string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCalculate = async () => {
        if (!query) return;

        setIsLoading(true);
        setResult(null);
        const response = await calculateNutrition(query, userProfile);
        setResult(response);
        if (typeof response !== 'string') {
            handleConsumeCredit(1);
        }
        setIsLoading(false);
    };

    const recommendationClasses = typeof result !== 'string' && result?.feedback.isRecommended
        ? { container: "bg-green-50/70 border-green-400", title: "text-green-800", text: "text-green-700" }
        : { container: "bg-red-50/70 border-red-400", title: "text-red-800", text: "text-red-700" };

    const creditCost = 1;
    const hasEnoughCredits = userProfile.plan === 'premium' || credits >= creditCost;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Calculadora Nutricional IA</h1>
            <p className="text-lg text-gray-600 mb-8">Describe una comida o alimento y la IA calculará su información nutricional y te dará una recomendación personalizada.</p>
            <GlassCard className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ej: 1 taza de arroz con 100g de pollo"
                        className="flex-grow p-3 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={!hasEnoughCredits || isLoading}
                    />
                    {hasEnoughCredits ? (
                        <button onClick={handleCalculate} disabled={isLoading || !query} className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Calculando...' : 'Calcular'}
                        </button>
                    ) : (
                        <button onClick={openUpgradeModal} className="bg-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-600 transition-all duration-300 flex items-center justify-center gap-2 flex-shrink-0">
                            <CrownIcon /> <span>Upgrade</span>
                        </button>
                    )}
                </div>
                {isLoading && <Loader />}
                {!isLoading && result && (
                     <div className="mt-8 p-2 animate-fade-in">
                        {typeof result === 'string' ? (
                            <p className="text-center text-red-500">{result}</p>
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-8">
                                <div className="text-center">
                                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Resultados del Cálculo</h2>
                                    <span className="text-5xl sm:text-6xl font-bold text-gray-800">{result.totalCalories}</span>
                                    <span className="text-2xl sm:text-3xl font-medium text-gray-600 align-baseline ml-2">kcal</span>
                                </div>

                                <div className="flex justify-center items-center flex-wrap gap-x-4 sm:gap-x-12 gap-y-6">
                                    <MacroCircle label="Proteína" value={result.macros.protein} color="#3B82F6" totalCalories={result.totalCalories} kcalPerGram={4} />
                                    <MacroCircle label="Carbs" value={result.macros.carbs} color="#F59E0B" totalCalories={result.totalCalories} kcalPerGram={4} />
                                    <MacroCircle label="Grasa" value={result.macros.fat} color="#EF4444" totalCalories={result.totalCalories} kcalPerGram={9} />
                                </div>

                                <div className="bg-fuchsia-100/70 p-4 rounded-xl text-center backdrop-blur-sm">
                                    <p className="font-semibold text-fuchsia-800">Azúcares</p>
                                    <p className="text-2xl font-bold text-fuchsia-900">{result.sugars.toFixed(1)}g</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Feedback de NutriAI</h3>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-200 backdrop-blur-sm">
                                            <h4 className="font-semibold text-gray-700 mb-2">Análisis de la Composición</h4>
                                            <p className="text-gray-600 leading-relaxed">{result.feedback.compositionAnalysis}</p>
                                        </div>
                                        
                                        <div className={`${recommendationClasses.container} border-l-4 p-6 backdrop-blur-sm`}>
                                            <h4 className={`font-semibold mb-2 ${recommendationClasses.title}`}>Recomendación para tu Meta</h4>
                                            <p className={`leading-relaxed ${recommendationClasses.text}`}>{result.feedback.recommendation}</p>
                                        </div>
                                    </div>
                                </div>
                          </div>
                        )}
                     </div>
                )}
            </GlassCard>
        </div>
    );
};

// --- AI Recipes View ---
export const AIRecipesView: React.FC<AIViewProps & { onSaveRecipe: (recipe: Recipe) => void }> = ({ onSaveRecipe, userProfile, credits, handleConsumeCredit, openUpgradeModal }) => {
    const [prompt, setPrompt] = useState('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    const handleGenerate = async () => {
        if (!prompt) return;

        setIsLoading(true);
        setRecipes([]);
        const profileDetails = `
          - Edad: ${userProfile.age} años
          - Género: ${userProfile.gender === 'male' ? 'Masculino' : userProfile.gender === 'female' ? 'Femenino' : 'No especificado'}
          - Peso: ${userProfile.weight} kg
          - Altura: ${userProfile.height} cm
          - Nivel de Actividad: ${userProfile.activityLevel}
          - Condición de salud: ${userProfile.condition}
          - Objetivo Principal: ${userProfile.goal}
        `;
        const fullPrompt = `Considerando el perfil de usuario (${profileDetails}), genera 2 recetas que cumplan con esta petición: "${prompt}"`;
        const result = await generateRecipes(fullPrompt, 2);
        setRecipes(result);
        if (result.length > 0) {
            handleConsumeCredit(1);
        }
        setIsLoading(false);
    };

    const handleSurpriseMe = async () => {
        setIsLoading(true);
        setRecipes([]);
        setPrompt('');

        const surpriseThemes = [
            'un plato vegetariano lleno de sabor',
            'una receta creativa con pollo o pavo',
            'una idea innovadora con legumbres como lentejas o garbanzos',
            'un plato de pescado blanco ligero (como merluza o lubina)',
            'una comida reconfortante con carne magra de ternera o cerdo',
            'una ensalada completa y nutritiva que sirva como plato único',
            'una sopa o crema exótica y saludable',
            'un salteado de verduras con tofu o gambas',
        ];
        const randomTheme = surpriseThemes[Math.floor(Math.random() * surpriseThemes.length)];

        const profileDetails = `
          - Edad: ${userProfile.age} años
          - Género: ${userProfile.gender === 'male' ? 'Masculino' : userProfile.gender === 'female' ? 'Femenino' : 'No especificado'}
          - Peso: ${userProfile.weight} kg
          - Altura: ${userProfile.height} cm
          - Nivel de Actividad: ${userProfile.activityLevel}
          - Condición de salud: ${userProfile.condition}
          - Objetivo Principal: ${userProfile.goal}
        `;
        const surprisePrompt = `Considerando el perfil de usuario (${profileDetails}), genera una receta saludable, creativa y sorprendente basada en la siguiente idea: ${randomTheme}.`;
        const result = await generateRecipes(surprisePrompt, 1);
        setRecipes(result);
        if (result.length > 0) {
            handleConsumeCredit(1);
        }
        setIsLoading(false);
    };

    const creditCost = 1;
    const hasEnoughCredits = userProfile.plan === 'premium' || credits >= creditCost;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Generador de Recetas con IA</h1>
            <p className="text-lg text-gray-600 mb-8">Describe qué te apetece comer o qué ingredientes tienes, y la IA creará recetas saludables para ti.</p>
            <GlassCard className="p-6 mb-6">
                {hasEnoughCredits ? (
                    <div className="flex flex-col sm:flex-row items-stretch gap-4">
                        <input 
                            type="text" 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Ej: Un almuerzo rápido con pollo"
                            className="flex-grow p-3 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={isLoading}
                        />
                        <div className="flex gap-4">
                            <button 
                                onClick={handleGenerate} 
                                disabled={isLoading || !prompt} 
                                className="flex-1 bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && prompt ? '...' : 'Generar'}
                            </button>
                            <button 
                                onClick={handleSurpriseMe} 
                                disabled={isLoading} 
                                className="flex-1 flex items-center justify-center gap-2 bg-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <SparklesIcon />
                                <span className="hidden sm:inline">{isLoading && !prompt ? '...' : 'Sorpréndeme'}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">No tienes créditos para generar recetas.</p>
                        <button onClick={openUpgradeModal} className="bg-purple-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-600 transition-all duration-300 flex items-center justify-center gap-2">
                            <CrownIcon /> Upgrade para recetas ilimitadas
                        </button>
                    </div>
                )}
            </GlassCard>
            {isLoading && <Loader />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recipes.map((recipe, index) => (
                    <GlassCard key={index} className="p-6 flex flex-col">
                        <h3 className="text-xl font-bold mb-2">{recipe.recipeName}</h3>
                        <p className="text-gray-600 mb-4 italic flex-grow">{recipe.description}</p>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/30">
                           <p className="text-sm text-gray-700"><strong>Tiempo:</strong> {recipe.prepTime}</p>
                           <button onClick={() => setSelectedRecipe(recipe)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Ver Receta</button>
                        </div>
                    </GlassCard>
                ))}
            </div>
             {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} onSave={onSaveRecipe} />}
        </div>
    );
};

// --- My Recipes View ---
export const MyRecipesView: React.FC<{ recipes: Recipe[] }> = ({ recipes }) => {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Mis Recetas Guardadas</h1>
            {recipes.length === 0 ? (
                <GlassCard className="p-6 text-center">
                    <p>Aún no has guardado ninguna receta. ¡Genera algunas en la sección "Recetas IA"!</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map((recipe, index) => (
                        <GlassCard key={index} className="p-6 flex flex-col">
                            <h3 className="text-xl font-bold mb-2">{recipe.recipeName}</h3>
                            <p className="text-gray-600 mb-4 italic flex-grow">{recipe.description}</p>
                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/30">
                                <p className="text-sm"><strong>Tiempo:</strong> {recipe.prepTime}</p>
                                <button onClick={() => setSelectedRecipe(recipe)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Ver Receta</button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
            {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
        </div>
    );
};

// --- Weekly Plan View ---
const MealCard: React.FC<{ mealType: string, recipe: Recipe, onSelectRecipe: (recipe: Recipe) => void }> = ({ mealType, recipe, onSelectRecipe }) => (
    <div className="bg-white/30 p-3 rounded-lg">
        <div className="flex justify-between items-center">
            <div className="pr-2">
                <p className="font-bold text-gray-800">{mealType}</p>
                <p className="text-sm text-gray-700 truncate">{recipe.recipeName}</p>
            </div>
            <button onClick={() => onSelectRecipe(recipe)} className="text-sm bg-blue-100/50 text-blue-600 font-semibold py-1 px-3 rounded-full hover:bg-blue-200/50 transition-colors flex-shrink-0">
                Ver
            </button>
        </div>
    </div>
);

export const WeeklyPlanView: React.FC<AIViewProps> = ({ userProfile, credits, handleConsumeCredit, openUpgradeModal }) => {
    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [numDays, setNumDays] = useState(7);
    const [preferences, setPreferences] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    const handleGeneratePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsLoading(true);
        setPlan(null);
        const profileString = `
          - Edad: ${userProfile.age} años
          - Género: ${userProfile.gender === 'male' ? 'Masculino' : userProfile.gender === 'female' ? 'Femenino' : 'No especificado'}
          - Peso: ${userProfile.weight} kg
          - Altura: ${userProfile.height} cm
          - Nivel de Actividad: ${userProfile.activityLevel}
          - Condición de salud: ${userProfile.condition}
          - Objetivo Principal: ${userProfile.goal}
        `;
        const result = await generateWeeklyPlan(profileString, numDays, preferences);
        setPlan(result);
        if (result) {
            handleConsumeCredit(3);
        }
        setIsLoading(false);
    };

    const creditCost = 3;
    const hasEnoughCredits = userProfile.plan === 'premium' || credits >= creditCost;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Generador de Plan Nutricional IA</h1>
            <p className="text-lg text-gray-600 mb-8">Crea un plan de comidas personalizado para varios días, alineado con tus metas y tu perfil de salud.</p>
            <GlassCard className="p-6 md:p-8 mb-8">
                <form onSubmit={handleGeneratePlan}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label htmlFor="numDays" className="block text-sm font-medium text-gray-700 mb-2">Número de Días</label>
                            <select 
                                id="numDays"
                                value={numDays}
                                onChange={(e) => setNumDays(parseInt(e.target.value))}
                                className="w-full p-3 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                                disabled={!hasEnoughCredits || isLoading}
                            >
                                {Array.from({ length: 7 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>
                                        {day} {day === 1 ? 'día' : 'días'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="preferences" className="block text-sm font-medium text-gray-700 mb-2">Preferencias o Alergias (opcional)</label>
                            <input 
                                type="text"
                                id="preferences"
                                value={preferences}
                                onChange={(e) => setPreferences(e.target.value)}
                                placeholder="Ej: vegetariano, sin lactosa"
                                className="w-full p-3 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                disabled={!hasEnoughCredits || isLoading}
                            />
                        </div>
                    </div>
                    {hasEnoughCredits ? (
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full flex items-center justify-center gap-3 bg-blue-500 text-white font-bold py-3 sm:py-4 px-8 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creando Plan...' : 'Generar Plan Nutricional'}
                            {!isLoading && <PlanIcon />}
                        </button>
                    ) : (
                        <button 
                            type="button"
                            onClick={openUpgradeModal}
                            className="w-full flex items-center justify-center gap-3 bg-purple-500 text-white font-bold py-3 sm:py-4 px-8 rounded-lg hover:bg-purple-600 transition-all duration-300 shadow-lg"
                        >
                            <CrownIcon /> Upgrade para generar planes
                        </button>
                    )}
                </form>
            </GlassCard>

            {isLoading && <Loader />}

            {plan && (
                 <div className="animate-fade-in">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => downloadWeeklyPlanAsPDF(plan, userProfile)}
                            className="bg-green-500 text-white font-bold py-2 px-4 rounded-full hover:bg-green-600 transition-colors flex items-center gap-2"
                        >
                            <DownloadIcon /> <span className="hidden sm:inline">Descargar Resumen</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(plan).map(([day, meals]) => {
                            const typedMeals = meals as WeeklyPlan[string];
                            return (
                                <GlassCard key={day} className="p-6">
                                    <h2 className="text-xl font-bold mb-4 text-center">{day}</h2>
                                    <div className="space-y-3">
                                        <MealCard mealType="Desayuno" recipe={typedMeals.desayuno} onSelectRecipe={setSelectedRecipe} />
                                        <MealCard mealType="Colación Mañana" recipe={typedMeals.colacion_manana} onSelectRecipe={setSelectedRecipe} />
                                        <MealCard mealType="Almuerzo" recipe={typedMeals.almuerzo} onSelectRecipe={setSelectedRecipe} />
                                        <MealCard mealType="Colación Tarde" recipe={typedMeals.colacion_tarde} onSelectRecipe={setSelectedRecipe} />
                                        <MealCard mealType="Cena" recipe={typedMeals.cena} onSelectRecipe={setSelectedRecipe} />
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            )}
            {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
        </div>
    );
};


// --- AI Chat View ---
export const AIChatView: React.FC<AIViewProps> = ({ userProfile, credits, handleConsumeCredit, openUpgradeModal }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'ai', text: `Hola ${userProfile.name}, soy NutriLife. ¿En qué puedo ayudarte hoy?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        const aiResponseText = await getAiChatResponse(input, userProfile);
        const aiMessage: ChatMessage = { sender: 'ai', text: aiResponseText };
        setMessages(prev => [...prev, aiMessage]);
        if (!aiResponseText.includes("Lo siento, estoy teniendo problemas")) {
            handleConsumeCredit(1);
        }
        setIsLoading(false);
    };
    
    const creditCost = 1;
    const hasEnoughCredits = userProfile.plan === 'premium' || credits >= creditCost;

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-4">Chat con NutriLife AI</h1>
            <GlassCard className="flex-grow p-4 flex flex-col">
                <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="max-w-md p-3 rounded-2xl bg-gray-200 text-gray-800"><TextLoader /></div></div>}
                    <div ref={chatEndRef} />
                </div>
                <div className="flex items-center gap-2 border-t border-white/30 pt-4">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && !isLoading && hasEnoughCredits && handleSend()}
                        placeholder={hasEnoughCredits ? "Escribe tu pregunta..." : "Necesitas créditos para chatear"}
                        className="flex-grow p-3 bg-white/50 border border-white/30 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={isLoading || !hasEnoughCredits}
                    />
                    {hasEnoughCredits ? (
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                           <SendIcon/>
                        </button>
                    ) : (
                        <button onClick={openUpgradeModal} className="bg-purple-500 text-white p-3 rounded-full hover:bg-purple-600 transition-colors">
                           <CrownIcon/>
                        </button>
                    )}
                </div>
            </GlassCard>
        </div>
    );
};

// --- Coach View ---
export const CoachView: React.FC<AIViewProps> = ({ userProfile, credits, handleConsumeCredit, openUpgradeModal }) => {
    const [focus, setFocus] = useState('Mejorar cardio y resistencia');
    const [days, setDays] = useState(3);
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState<WorkoutPlan | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePlan = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        setPlan(null);
        setError(null);
        try {
            const result = await generateWorkoutPlan(userProfile, focus, days);
            if (result) {
                setPlan(result);
                handleConsumeCredit(3);
            } else {
                setError('No se pudo generar el plan. La IA podría estar ocupada. Por favor, inténtalo de nuevo en unos momentos.');
            }
        } catch (err) {
            setError('Ocurrió un error inesperado al generar el plan.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const creditCost = 3;
    const hasEnoughCredits = userProfile.plan === 'premium' || credits >= creditCost;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Coach AI</h1>
            <p className="text-lg text-gray-600 mb-8">Tu entrenador personal para ponerte en forma de manera segura y efectiva.</p>
            
            {!plan && !isLoading && (
                <GlassCard className="p-6 md:p-8 mb-8 animate-fade-in">
                    <form onSubmit={handleGeneratePlan}>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Crea tu rutina personalizada</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="focus" className="block text-sm font-medium text-gray-700 mb-2">Objetivo Principal</label>
                                <select 
                                    id="focus"
                                    value={focus}
                                    onChange={(e) => setFocus(e.target.value)}
                                    className="w-full p-3 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                                    disabled={!hasEnoughCredits || isLoading}
                                >
                                    <option>Mejorar cardio y resistencia</option>
                                    <option>Fortalecimiento general (bajo impacto)</option>
                                    <option>Flexibilidad y movilidad</option>
                                    <option>Perder peso de forma segura</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">Días por semana</label>
                                <select 
                                    id="days"
                                    value={days}
                                    onChange={(e) => setDays(parseInt(e.target.value))}
                                    className="w-full p-3 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                                    disabled={!hasEnoughCredits || isLoading}
                                >
                                    <option value={3}>3 días</option>
                                    <option value={4}>4 días</option>
                                    <option value={5}>5 días</option>
                                </select>
                            </div>
                        </div>
                        {hasEnoughCredits ? (
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 bg-blue-500 text-white font-bold py-3 sm:py-4 px-8 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Generar mi rutina
                                <CoachIcon />
                            </button>
                        ) : (
                             <button 
                                type="button"
                                onClick={openUpgradeModal}
                                className="w-full flex items-center justify-center gap-3 bg-purple-500 text-white font-bold py-3 sm:py-4 px-8 rounded-lg hover:bg-purple-600 transition-all duration-300 shadow-lg"
                            >
                                <CrownIcon /> Upgrade para crear rutinas
                            </button>
                        )}
                    </form>
                </GlassCard>
            )}

            {isLoading && (
                <GlassCard className="p-8 text-center">
                    <Loader />
                    <p className="mt-4 text-gray-600 font-semibold">Creando una rutina segura y efectiva para ti...</p>
                </GlassCard>
            )}
            
            {error && !isLoading && (
                <GlassCard className="p-8 text-center text-red-600 bg-red-50/70">
                    <p className="font-bold">¡Ups! Algo salió mal.</p>
                    <p>{error}</p>
                </GlassCard>
            )}

            {plan && !isLoading && (
                <div className="animate-fade-in space-y-8">
                    <GlassCard className="p-6">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-800">{plan.planName}</h2>
                            <p className="text-lg text-gray-600">{plan.focus} - {plan.duration}</p>
                        </div>
                        
                        <div className="bg-yellow-50/70 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-8">
                            <h3 className="font-bold text-yellow-800 mb-2">¡Importante! Recomendaciones de Seguridad</h3>
                            <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                {plan.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                            </ul>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {Object.entries(plan.schedule).map(([day, workouts]) => (
                                <div key={day} className="bg-white/40 p-4 rounded-xl shadow-sm">
                                    <h3 className="font-bold text-xl mb-4 text-center text-gray-700">{day}</h3>
                                    <ul className="space-y-4">
                                        {(workouts as Workout[]).map((workout, i) => (
                                            <li key={i} className="bg-white/50 p-3 rounded-lg">
                                                <p className="font-semibold text-gray-800">{workout.name}</p>
                                                <p className="text-sm text-gray-600 mt-1">{workout.description}</p>
                                                <div className="flex justify-between items-center mt-2 text-xs font-medium text-gray-500 pt-2 border-t border-gray-200/50">
                                                    <span>SERIES: <strong>{workout.sets}</strong></span>
                                                    <span>REPS: <strong>{workout.repetitions}</strong></span>
                                                    <span>DESCANSO: <strong>{workout.rest}</strong></span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                    <div className="text-center flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => setPlan(null)} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-full hover:bg-gray-600 transition-colors">
                            Crear otra rutina
                        </button>
                        <button 
                            onClick={() => downloadWorkoutPlanAsPDF(plan)}
                            className="bg-green-500 text-white font-bold py-2 px-6 rounded-full hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <DownloadIcon /> Descargar Rutina
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const UpgradeModal: React.FC<{ onClose: () => void; onUpgrade: () => void; }> = ({ onClose, onUpgrade }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
        <GlassCard className="p-6 md:p-8 w-full max-w-lg flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-purple-400/30 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-blue-400/30 rounded-full blur-2xl"></div>
            
            <div className="text-center z-10">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                        <CrownIcon />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Desbloquea NutriLife Premium</h2>
                <p className="text-gray-600 mt-2 mb-6">Obtén acceso ilimitado a todas las funciones de IA y lleva tu salud al siguiente nivel.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4 z-10">
                <div className="bg-gray-100/50 p-4 rounded-lg text-center">
                    <h3 className="font-semibold text-gray-700">Plan Gratuito</h3>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li><span className="text-green-500 mr-1">✓</span> 7 Créditos de IA</li>
                        <li><span className="text-red-500 mr-1">✗</span> Generaciones ilimitadas</li>
                        <li><span className="text-red-500 mr-1">✗</span> Chat IA sin límites</li>
                    </ul>
                </div>
                <div className="bg-green-100/50 border border-green-400 p-4 rounded-lg text-center">
                    <h3 className="font-semibold text-green-800">Plan Premium</h3>
                     <ul className="text-sm text-green-700 mt-2 space-y-1">
                        <li><span className="text-green-500 mr-1">✓</span> Créditos de IA Ilimitados</li>
                        <li><span className="text-green-500 mr-1">✓</span> Todas las funciones sin fin</li>
                        <li><span className="text-green-500 mr-1">✓</span> Soporte prioritario</li>
                    </ul>
                </div>
            </div>

            <div className="text-center my-4 z-10">
                <p className="text-4xl font-bold text-gray-800">$19 <span className="text-lg font-normal text-gray-600">/ mes</span></p>
            </div>

            <div className="mt-6 pt-4 z-10 flex flex-col gap-3">
                <button onClick={onUpgrade} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                    Actualizar a Premium
                </button>
                <button onClick={onClose} className="w-full text-gray-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-200/50 transition-colors">
                    Quizás más tarde
                </button>
            </div>
        </GlassCard>
    </div>
);