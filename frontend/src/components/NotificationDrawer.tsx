import React, { useEffect, useState } from 'react';
import { api, getAuthToken } from '../api/client';
import { NotificationItem } from '../types';
import { useWebSocket } from '../context/WebSocketContext';
import { Bell, Check, Clock, AlertTriangle, X, CheckCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { lastEvent } = useWebSocket();

  const fetchNotifications = async () => {
    if (!getAuthToken()) return;
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    if (lastEvent && (lastEvent.type === 'NOTIFICATION_ALERT' || lastEvent.type === 'BOOKING_REVIEWED')) {
      fetchNotifications();
    }
  }, [lastEvent]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Translucent Backdrop Scrim */}
      <div
        className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-sm transition-opacity drawer-backdrop cursor-pointer"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Campus Alerts & Notifications</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="text-xs text-slate-600 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 flex items-center gap-1 py-1 px-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No notifications at this time.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition duration-200 ${
                    notif.is_read
                      ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 opacity-80'
                      : 'bg-white dark:bg-slate-800/90 border-sky-200 dark:border-indigo-500/30 text-slate-800 dark:text-slate-200 shadow-sm ring-1 ring-sky-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {notif.type === 'overdue_alert' ? (
                        <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-transparent">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      ) : notif.type === 'reminder_24h' ? (
                        <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-transparent">
                          <Clock className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-transparent">
                          <Bell className="w-4 h-4" />
                        </span>
                      )}
                      <h4 className={`text-xs sm:text-sm font-bold ${notif.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {notif.title}
                      </h4>
                    </div>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-xs text-sky-600 hover:text-sky-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 p-1 hover:bg-sky-50 dark:hover:bg-slate-700/50 rounded-lg transition"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs mt-2 leading-relaxed text-slate-600 dark:text-slate-300">{notif.message}</p>
                  <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
