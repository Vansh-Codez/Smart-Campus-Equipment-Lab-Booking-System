import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWebSocket } from '../context/WebSocketContext';
import { NotificationDrawer } from './NotificationDrawer';
import { api } from '../api/client';
import {
  Cpu,
  LayoutDashboard,
  Calendar,
  Layers,
  ClipboardList,
  ClipboardCheck,
  ShieldAlert,
  Bell,
  Sun,
  Moon,
  LogOut,
  Radio,
  User as UserIcon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected, lastEvent } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      if (user) {
        const notifs = await api.getNotifications();
        const unread = notifs.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [user]);

  useEffect(() => {
    if (lastEvent) {
      fetchUnread();
    }
  }, [lastEvent]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: LayoutDashboard, 
      roles: ['student', 'lab_assistant', 'admin'],
      color: 'text-sky-500 group-hover:text-sky-600',
    },
    { 
      name: 'Directory', 
      path: '/directory', 
      icon: Layers, 
      roles: ['student', 'lab_assistant', 'admin'],
      color: 'text-emerald-500 group-hover:text-emerald-600',
    },
    { 
      name: 'Calendar Slots', 
      path: '/calendar', 
      icon: Calendar, 
      roles: ['student', 'lab_assistant', 'admin'],
      color: 'text-purple-500 group-hover:text-purple-600',
    },
    { 
      name: 'My Bookings', 
      path: '/my-bookings', 
      icon: ClipboardList, 
      roles: ['student', 'lab_assistant', 'admin'],
      color: 'text-amber-500 group-hover:text-amber-600',
    },
    { 
      name: 'Requisitions Queue', 
      path: '/assistant/queue', 
      icon: ClipboardCheck, 
      roles: ['lab_assistant', 'admin'],
      color: 'text-cyan-500 group-hover:text-cyan-600',
    },
    { 
      name: 'Admin Panel', 
      path: '/admin', 
      icon: ShieldAlert, 
      roles: ['admin'],
      color: 'text-rose-500 group-hover:text-rose-600',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition duration-200 shrink-0">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-sky-600 dark:text-cyan-400 group-hover:rotate-12 transition duration-300" />
                </div>
              </div>
              <div className="shrink-0 whitespace-nowrap">
                <div className="font-extrabold tracking-tight text-sm sm:text-base bg-gradient-to-r from-slate-900 via-sky-900 to-sky-600 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent leading-none">
                  Smart Campus
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-semibold leading-none mt-1">
                  Lab & Equipment OS
                </div>
              </div>
            </Link>

            {/* Live WebSocket Status Badge */}
            <div
              className={`hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border shrink-0 ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
              }`}
              title={isConnected ? 'Connected to live WebSocket slot sync' : 'Reconnecting...'}
            >
              <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
              <span>{isConnected ? 'Live Sync' : 'Offline'}</span>
            </div>
          </div>

          {/* Nav Items - Pill Styled */}
          <nav className="hidden xl:flex items-center gap-1.5 shrink-0">
            {navLinks
              .filter((l) => !user || l.roles.includes(user.role))
              .map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 border border-sky-200/90 shadow-sm font-semibold dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-sky-50/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-125 group-hover:-translate-y-0.5 ${link.color}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Right Tools */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live WebSocket Status Badge for standard desktop */}
            <div
              className={`hidden md:flex 2xl:hidden items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
              }`}
              title={isConnected ? 'Connected to live WebSocket slot sync' : 'Reconnecting...'}
            >
              <Radio className={`w-2.5 h-2.5 ${isConnected ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Theme Toggle - Rounded Pill */}
            <button
              onClick={toggleTheme}
              className="px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-sky-300 dark:hover:border-slate-600 hover:scale-105 transition flex items-center gap-1.5 shadow-sm shrink-0"
              title={`Currently in ${theme.toUpperCase()} mode. Click to toggle light/dark.`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px] font-medium text-slate-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline text-[11px] font-medium text-slate-700">Dark</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            {user && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition shrink-0"
                title="View Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Chip & Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
                <div className="hidden sm:block text-right max-w-[130px]">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{user.name}</div>
                  <div className="text-[10px] uppercase font-bold text-sky-600 dark:text-indigo-400 tracking-wider truncate">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-indigo-600/30 border border-sky-200 dark:border-indigo-500/40 text-sky-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition ml-1 shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-semibold shadow-sm shadow-sky-600/20 transition shrink-0"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Navigation Bar */}
        <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center overflow-x-auto gap-2 text-xs no-scrollbar">
          {navLinks
            .filter((l) => !user || l.roles.includes(user.role))
            .map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-600 text-white dark:bg-indigo-600 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:scale-125 ${isActive ? 'text-white' : link.color}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
        </div>
      </header>

      <NotificationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
