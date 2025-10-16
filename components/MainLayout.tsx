import React from 'react';
import { Section } from '../types';
import { MonitorIcon, HabitsIcon, ScannerIcon, CalculatorIcon, RecipesIcon, PlanIcon, ChatIcon, MyRecipesIcon, UserIcon, CoachIcon, CoinIcon, CrownIcon, MenuIcon, CloseIcon } from './Icons';
import AnimatedBackground from './ui/AnimatedBackground';

interface MainLayoutProps {
  children: React.ReactNode;
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  userName: string;
  credits: number;
  plan: 'free' | 'premium';
  onUpgradeClick: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const navItems = [
  { id: Section.MONITOREO, label: 'Monitoreo', icon: <MonitorIcon /> },
  { id: Section.HABITOS, label: 'Hábitos', icon: <HabitsIcon /> },
  { id: Section.PLAN_SEMANAL, label: 'Plan Semanal', icon: <PlanIcon /> },
  { id: Section.COACH, label: 'Coach AI', icon: <CoachIcon /> },
  { id: Section.SCANNER, label: 'Escáner IA', icon: <ScannerIcon /> },
  { id: Section.CALCULADORA, label: 'Calculadora', icon: <CalculatorIcon /> },
  { id: Section.RECETAS, label: 'Recetas IA', icon: <RecipesIcon /> },
  { id: Section.MIS_RECETAS, label: 'Mis Recetas', icon: <MyRecipesIcon /> },
  { id: Section.CHAT, label: 'Chat IA', icon: <ChatIcon /> },
  { id: Section.PERFIL, label: 'Mi Perfil', icon: <UserIcon /> },
];

const Sidebar: React.FC<Omit<MainLayoutProps, 'children'>> = ({ activeSection, setActiveSection, userName, credits, plan, onUpgradeClick, isSidebarOpen, setIsSidebarOpen }) => {
  const handleItemClick = (section: Section) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  return (
    <>
        {/* Backdrop for mobile */}
        <div 
            className={`fixed inset-0 bg-black/20 z-30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsSidebarOpen(false)}
        ></div>

        <aside className={`fixed inset-y-0 left-0 w-64 bg-white/60 backdrop-blur-xl border-r border-white/30 p-6 flex flex-col shadow-lg z-40
                        transform transition-transform duration-300 ease-in-out md:relative md:transform-none md:shadow-lg md:rounded-r-2xl
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="flex justify-between items-center mb-8 md:block">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">NutriLife AI</h1>
                  <p className="text-gray-600 md:mb-8">Hola, {userName}</p>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 -mr-2">
                    <CloseIcon/>
                </button>
            </div>

            <nav className="flex flex-col space-y-2 flex-grow">
                {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                    activeSection === item.id 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-blue-100/50 hover:text-blue-600'
                    }`}
                >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                </button>
                ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-white/30">
                {plan === 'free' ? (
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold text-gray-700">
                        <CoinIcon />
                        <span>{credits} Créditos</span>
                    </div>
                    <button onClick={onUpgradeClick} className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                        <CrownIcon />
                        <span>Upgrade</span>
                    </button>
                </div>
                ) : (
                <div className="flex items-center justify-center gap-2 text-lg font-semibold text-yellow-500 bg-yellow-500/10 p-3 rounded-lg">
                    <CrownIcon />
                    <span>Plan Premium</span>
                </div>
                )}
            </div>
        </aside>
    </>
  );
};

const MobileHeader: React.FC<{onMenuClick: () => void}> = ({onMenuClick}) => {
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/30 backdrop-blur-lg shadow-sm z-20 flex items-center px-4">
            <button onClick={onMenuClick} className="p-2 text-gray-700">
                <MenuIcon/>
            </button>
            <h1 className="text-xl font-bold text-gray-800 ml-4">NutriLife AI</h1>
        </header>
    );
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeSection, setActiveSection, userName, credits, plan, onUpgradeClick, isSidebarOpen, setIsSidebarOpen }) => {
  return (
    <div className="min-h-screen w-full text-gray-800">
      <AnimatedBackground />
      <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex h-screen md:p-4">
        <Sidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
            userName={userName} 
            credits={credits} 
            plan={plan} 
            onUpgradeClick={onUpgradeClick}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
        />
        <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};