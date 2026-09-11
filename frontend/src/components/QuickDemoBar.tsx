import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { GraduationCap, FlaskConical, ShieldCheck, Sparkles } from 'lucide-react';

export const QuickDemoBar: React.FC = () => {
  const { user, switchDemoRole, loading } = useAuth();

  const personas: { role: UserRole; label: string; name: string; icon: any; color: string }[] = [
    {
      role: 'student',
      label: 'Student / Researcher',
      name: 'Alex Rivera',
      icon: GraduationCap,
      color: 'from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    {
      role: 'lab_assistant',
      label: 'Lab Assistant / Faculty',
      name: 'Dr. Sarah Chen',
      icon: FlaskConical,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      role: 'admin',
      label: 'System Admin',
      name: 'Prof. Marcus Vance',
      icon: ShieldCheck,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
    },
  ];

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/90 dark:border-slate-800 text-xs py-1.5 px-4 text-slate-700 dark:text-slate-300 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Interactive Demo Switcher:</span>
        </div>
        <div className="flex items-center gap-2">
          {personas.map((p) => {
            const Icon = p.icon;
            const isActive = user?.role === p.role;
            return (
              <button
                key={p.role}
                disabled={loading}
                onClick={() => switchDemoRole(p.role)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-sky-600 text-white border-sky-400 shadow-sm shadow-sky-500/30 ring-1 ring-sky-400'
                    : 'bg-white dark:bg-slate-800/80 hover:bg-sky-50/70 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700 hover:border-sky-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span className="hidden sm:inline">{p.label}:</span>
                <span className={isActive ? 'font-semibold text-white' : 'text-slate-500 dark:text-slate-400'}>{p.name}</span>
                {isActive && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
