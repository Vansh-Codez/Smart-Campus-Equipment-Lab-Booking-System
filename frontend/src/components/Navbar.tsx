import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWebSocket } from '../context/WebSocketContext';
import { NotificationDrawer } from './NotificationDrawer';
import { api } from '../api/client';
import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  Layers3,
  LogOut,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Cpu,
} from 'lucide-react';

const navLinks = [
  { name: 'Overview', path: '/', icon: LayoutDashboard, roles: ['student', 'lab_assistant', 'admin'] },
  { name: 'Resource library', path: '/directory', icon: Layers3, roles: ['student', 'lab_assistant', 'admin'] },
  { name: 'Book a slot', path: '/calendar', icon: CalendarDays, roles: ['student', 'lab_assistant', 'admin'] },
  { name: 'My bookings', path: '/my-bookings', icon: ClipboardList, roles: ['student', 'lab_assistant', 'admin'] },
  { name: 'Review queue', path: '/assistant/queue', icon: ClipboardCheck, roles: ['lab_assistant', 'admin'] },
  { name: 'Admin studio', path: '/admin', icon: Shield, roles: ['admin'] },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected, lastEvent } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const notifications = await api.getNotifications();
      setUnreadCount(notifications.filter((notification: any) => !notification.is_read).length);
    } catch {
      // Notification availability should never block navigation.
    }
  };

  useEffect(() => { fetchUnread(); }, [user]);
  useEffect(() => {
    if (lastEvent && lastEvent.type !== 'pong') fetchUnread();
  }, [lastEvent]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleLinks = navLinks.filter((link) => !user || link.roles.includes(user.role));
  const isCurrent = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <header className="topbar">
        <div className="mx-auto flex h-[4.35rem] w-[min(100%-2rem,1160px)] items-center justify-between gap-4">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <span className="brand-mark shrink-0"><Cpu className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[0.92rem] font-extrabold tracking-tight text-slate-900 dark:text-white">Smart Campus</span>
              <span className="block truncate text-[0.62rem] font-bold uppercase tracking-[0.17em] text-slate-400 dark:text-slate-500">Resource operations</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {visibleLinks.map(({ name, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-[0.72rem] font-semibold transition ${
                  isCurrent(path)
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/20'
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 ${isCurrent(path) ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400'}`} />
                <span>{name}</span>
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.63rem] font-bold md:flex ${isConnected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`} title={isConnected ? 'Live slot synchronization is connected' : 'Reconnecting to live synchronization'}>
              <Activity className={`h-3 w-3 ${isConnected ? 'animate-pulse' : ''}`} />
              {isConnected ? 'Live' : 'Offline'}
            </span>
            <button onClick={toggleTheme} className="hidden rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:block dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
            {user && (
              <button onClick={() => setDrawerOpen(true)} className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white" title="Open notifications">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && <span className="absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-rose-500 px-0.5 text-[0.55rem] font-extrabold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
            )}
            {user ? (
              <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-2 dark:border-slate-700/70">
                <div className="hidden text-right sm:block">
                  <div className="max-w-[130px] truncate text-[0.7rem] font-bold text-slate-800 dark:text-slate-100">{user.name}</div>
                  <div className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-indigo-500 dark:text-indigo-300">{user.role.replace('_', ' ')}</div>
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-extrabold text-white shadow-sm shadow-indigo-500/20">{user.name.charAt(0).toUpperCase()}</div>
                <button onClick={handleLogout} className="hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 sm:block dark:hover:bg-rose-500/10" title="Sign out"><LogOut className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary px-3 py-2 text-[0.7rem]"><Sparkles className="h-3.5 w-3.5" /> Sign in</Link>
            )}
          </div>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-slate-200/70 px-4 py-2 lg:hidden dark:border-slate-800/80" aria-label="Mobile navigation">
          {visibleLinks.map(({ name, path, icon: Icon }) => (
            <Link key={path} to={path} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.67rem] font-bold transition ${isCurrent(path) ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
              <Icon className="h-3.5 w-3.5" />{name}
            </Link>
          ))}
        </nav>
      </header>
      <NotificationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
