import React, { useState, useCallback, useEffect } from 'react';
import { Section, UserProfile, Recipe, Habit } from './types';
import { MainLayout } from './components/MainLayout';
import { WelcomeView, OnboardingView, DashboardView, HabitsView, AIScannerView, CalculatorView, AIRecipesView, MyRecipesView, WeeklyPlanView, AIChatView, ProfileView, CoachView, UpgradeModal } from './components/Views';
import { auth, onAuthStateChanged, signInWithGoogle, signOutUser, User } from './services/firebaseService';
import { Loader } from './components/ui/Loader';

const App: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>(Section.WELCOME);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [credits, setCredits] = useState<number>(0);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [stars, setStars] = useState<number>(0);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [animationClass, setAnimationClass] = useState('animate-fade-in');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false);
      if (!user) {
        // User is signed out, clear all local state
        setUserProfile(null);
        setHabits([]);
        setStars(0);
        setCredits(0);
        setMyRecipes([]);
        setActiveSection(Section.WELCOME);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
        const profileKey = `nutrilife_userProfile_${firebaseUser.uid}`;
        const habitsKey = `nutrilife_habits_${firebaseUser.uid}`;
        const starsKey = `nutrilife_stars_${firebaseUser.uid}`;
        const creditsKey = `nutrilife_credits_${firebaseUser.uid}`;
        const recipesKey = `nutrilife_myRecipes_${firebaseUser.uid}`;

        try {
            const savedProfile = window.localStorage.getItem(profileKey);
            if (savedProfile) {
                const parsedProfile: UserProfile = JSON.parse(savedProfile);
                setUserProfile(parsedProfile);
                setActiveSection(Section.MONITOREO);

                const savedHabits = window.localStorage.getItem(habitsKey);
                if (savedHabits) setHabits(JSON.parse(savedHabits));

                const savedStars = window.localStorage.getItem(starsKey);
                if (savedStars) setStars(JSON.parse(savedStars));

                const savedCredits = window.localStorage.getItem(creditsKey);
                if (savedCredits) {
                    setCredits(JSON.parse(savedCredits));
                } else if (parsedProfile.plan === 'free') {
                    setCredits(7); // Default credits if none saved
                }

                const savedRecipes = window.localStorage.getItem(recipesKey);
                if (savedRecipes) setMyRecipes(JSON.parse(savedRecipes));

            } else {
                // No profile yet, go to onboarding
                setActiveSection(Section.ONBOARDING);
            }
        } catch (error) {
            console.error("Could not read user data from localStorage", error);
        }
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (firebaseUser && userProfile) {
      try {
        const profileKey = `nutrilife_userProfile_${firebaseUser.uid}`;
        const habitsKey = `nutrilife_habits_${firebaseUser.uid}`;
        const starsKey = `nutrilife_stars_${firebaseUser.uid}`;
        const creditsKey = `nutrilife_credits_${firebaseUser.uid}`;
        const recipesKey = `nutrilife_myRecipes_${firebaseUser.uid}`;
        
        window.localStorage.setItem(profileKey, JSON.stringify(userProfile));
        window.localStorage.setItem(habitsKey, JSON.stringify(habits));
        window.localStorage.setItem(starsKey, JSON.stringify(stars));
        window.localStorage.setItem(creditsKey, JSON.stringify(credits));
        window.localStorage.setItem(recipesKey, JSON.stringify(myRecipes));
      } catch (error) {
        console.error("Could not save state to localStorage", error);
      }
    }
  }, [firebaseUser, userProfile, habits, stars, credits, myRecipes]);


  const handleSetSection = useCallback((section: Section) => {
    setAnimationClass('animate-fade-out');
    setIsSidebarOpen(false); // Close sidebar on navigation
    setTimeout(() => {
      setActiveSection(section);
      setAnimationClass('animate-fade-in');
    }, 300);
  }, []);
  
  const handleOnboardingComplete = (profile: Omit<UserProfile, 'plan'>) => {
    const fullProfile: UserProfile = { ...profile, plan: 'free' };
    setUserProfile(fullProfile);
    setCredits(7);
    handleSetSection(Section.HABITOS);
  };
  
  const handleSignOut = async () => {
    await signOutUser();
  };

  const handleConsumeCredit = (amount: number) => {
    if (userProfile?.plan === 'free') {
        setCredits(prev => Math.max(0, prev - amount));
    }
  };

  const handleUpgrade = () => {
    if (userProfile) {
        setUserProfile({ ...userProfile, plan: 'premium' });
        setIsUpgradeModalOpen(false);
        alert('¡Felicidades! Has actualizado a NutriLife AI Premium con funciones ilimitadas.');
    }
  };


  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    alert('¡Perfil actualizado con éxito!');
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    if (!myRecipes.some(r => r.recipeName === recipe.recipeName)) {
      setMyRecipes(prev => [...prev, recipe]);
      alert('Receta guardada!');
    } else {
      alert('Ya tienes esta receta guardada.');
    }
  };

  const handleUpdateStars = (amount: number) => {
    setStars(prev => Math.max(0, prev + amount));
  };
  
  const handleUpdateHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
  };

  const renderContent = () => {
    if (!firebaseUser) {
        return <WelcomeView onLogin={signInWithGoogle} />;
    }
    
    if (!userProfile) {
        return <OnboardingView onComplete={handleOnboardingComplete} firebaseUser={firebaseUser} />;
    }

    const aiViewProps = {
        userProfile,
        credits,
        handleConsumeCredit,
        openUpgradeModal: () => setIsUpgradeModalOpen(true)
    };

    switch (activeSection) {
      case Section.PERFIL:
        return <ProfileView userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onUpgradeClick={() => setIsUpgradeModalOpen(true)} onSignOut={handleSignOut} />;
      case Section.MONITOREO:
        return <DashboardView userProfile={userProfile} />;
      case Section.HABITOS:
        return <HabitsView stars={stars} onUpdateStars={handleUpdateStars} habits={habits} onUpdateHabits={handleUpdateHabits} />;
      case Section.SCANNER:
        return <AIScannerView {...aiViewProps} />;
      case Section.CALCULADORA:
        return <CalculatorView {...aiViewProps} />;
      case Section.RECETAS:
        return <AIRecipesView onSaveRecipe={handleSaveRecipe} {...aiViewProps} />;
      case Section.MIS_RECETAS:
        return <MyRecipesView recipes={myRecipes} />;
      case Section.PLAN_SEMANAL:
        return <WeeklyPlanView {...aiViewProps} />;
      case Section.COACH:
        return <CoachView {...aiViewProps} />;
      case Section.CHAT:
        return <AIChatView {...aiViewProps} />;
      default:
        return <DashboardView userProfile={userProfile} />;
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
        <Loader />
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
         <div className={animationClass}>{renderContent()}</div>
      </div>
    );
  }

  return (
    <>
      <MainLayout 
        activeSection={activeSection} 
        setActiveSection={handleSetSection} 
        userName={userProfile.name}
        credits={credits}
        plan={userProfile.plan}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      >
        <div className={animationClass}>
          {renderContent()}
        </div>
      </MainLayout>
      {isUpgradeModalOpen && <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} onUpgrade={handleUpgrade} />}
    </>
  );
};

export default App;
