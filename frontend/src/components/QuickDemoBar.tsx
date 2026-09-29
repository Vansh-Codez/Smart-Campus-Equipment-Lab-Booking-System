import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { FlaskConical, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

export const QuickDemoBar: React.FC = () => {
  const { user, switchDemoRole, loading } = useAuth();

  const personas: { role: UserRole; label: string; name: string; icon: any }[] = [
    { role: 'student', label: 'Student', name: 'Alex Rivera', icon: GraduationCap },
    { role: 'lab_assistant', label: 'Lab assistant', name: 'Dr. Sarah Chen', icon: FlaskConical },
    { role: 'admin', label: 'Administrator', name: 'Prof. Marcus Vance', icon: ShieldCheck },
  ];

  return (
    <div className="demo-strip px-4 py-1.5 text-[0.66rem]">
      <div className="mx-auto flex w-[min(100%,1160px)] flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">Preview workspace</span>
          <span className="sm:hidden">Demo access</span>
          <span className="hidden text-slate-400 sm:inline">· Switch personas without leaving the flow</span>
        </div>
        <div className="flex max-w-full gap-1.5 overflow-x-auto no-scrollbar">
          {personas.map(({ role, label, name, icon: Icon }) => {
            const active = user?.role === role;
            return (
              <button
                key={role}
                disabled={loading}
                onClick={() => switchDemoRole(role)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 font-semibold transition ${active ? 'border-indigo-300 bg-indigo-600 text-white shadow-sm dark:border-indigo-400' : 'border-slate-200 bg-white/70 text-slate-600 hover:border-indigo-200 hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
                <span className={`hidden md:inline ${active ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>{name}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
