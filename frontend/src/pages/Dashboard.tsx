import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Equipment, Booking } from '../types';
import {
  Cpu,
  Layers,
  Calendar,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  HardDrive,
  Sparkles,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [queueBookings, setQueueBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eq, myB] = await Promise.all([
          api.getEquipment(),
          api.getMyBookings().catch(() => []),
        ]);
        setEquipmentList(eq);
        setMyBookings(myB);

        if (user?.role === 'lab_assistant' || user?.role === 'admin') {
          const queue = await api.getQueue('pending').catch(() => []);
          setQueueBookings(queue);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const activeBooking = myBookings.find((b) => b.status === 'checked_out' || b.status === 'approved');
  const availableCount = equipmentList.filter((e) => e.status === 'available').length;
  const inUseCount = equipmentList.filter((e) => e.status === 'issued' || e.status === 'booked').length;
  const maintenanceCount = equipmentList.filter((e) => e.status === 'under_maintenance').length;
  const overdueCount = equipmentList.filter((e) => e.status === 'overdue').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Hero Banner - GunanQ Rich Ocean Blue / Blueprint Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-700 via-sky-800 to-slate-900 dark:from-indigo-950/90 dark:via-slate-900 dark:to-slate-950 border border-sky-600/30 dark:border-indigo-500/20 p-6 sm:p-10 shadow-xl gunanq-hero backdrop-blur-md">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Academic Term 2026-27 Active</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-200 to-white">{user?.name}</span>
          </h1>

          <p className="text-sm text-sky-100/90 dark:text-slate-300 leading-relaxed font-normal">
            {user?.role === 'student' &&
              'Reserve academic computing rigs, software engineering pods, network analyzers, science apparatus, and workshop equipment across BVS & MMS blocks for your coursework and research.'}
            {user?.role === 'lab_assistant' &&
              'Manage lab requisitions, inspect check-ins, record condition notes, and maintain equipment availability across all campus labs.'}
            {user?.role === 'admin' &&
              'Oversee campus-wide inventory master data, evaluate equipment utilization analytics, and manage academic lab roles.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/directory"
              className="group px-5 py-2.5 rounded-full bg-white text-sky-950 hover:bg-sky-50 font-bold text-xs shadow-md shadow-black/10 flex items-center gap-2 transition hover:scale-105"
            >
              <Layers className="w-4 h-4 text-sky-600 transition-transform duration-200 ease-out group-hover:scale-125 group-hover:-translate-y-0.5" />
              <span className="text-sky-950 font-bold">Explore Resource Directory</span>
            </Link>

            <Link
              to="/calendar"
              className="group px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs font-semibold backdrop-blur-sm flex items-center gap-2 transition hover:scale-105"
            >
              <Calendar className="w-4 h-4 text-sky-200 transition-transform duration-200 ease-out group-hover:scale-125 group-hover:-translate-y-0.5" />
              <span>View Slot Availability</span>
            </Link>

            {(user?.role === 'lab_assistant' || user?.role === 'admin') && (
              <Link
                to="/assistant/queue"
                className="group px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center gap-2 transition hover:scale-105"
              >
                <ClipboardList className="w-4 h-4 text-emerald-100 transition-transform duration-200 ease-out group-hover:scale-125 group-hover:-translate-y-0.5" />
                <span className="text-white font-bold">Requisitions Queue ({queueBookings.length})</span>
              </Link>
            )}
          </div>
        </div>

        {/* Decorative Grid Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 hidden md:flex items-center justify-center pointer-events-none">
          <Cpu className="w-72 h-72 text-cyan-200" />
        </div>
      </div>

      {/* KPI Stats Grid - GunanQ High-Contrast Elevated Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-emerald-300 dark:hover:border-emerald-500/40 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available Equipment</span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{availableCount}</div>
          <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <span>Ready for immediate booking</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-sky-300 dark:hover:border-indigo-500/40 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Currently In Use / Booked</span>
            <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-sky-200/60 dark:border-indigo-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{inUseCount}</div>
          <div className="mt-2 text-[11px] text-sky-700 dark:text-indigo-400 font-semibold">
            <span>Active research reservations</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-amber-300 dark:hover:border-amber-500/40 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Under Maintenance</span>
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{maintenanceCount}</div>
          <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
            <span>Calibration or repairs active</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-rose-300 dark:hover:border-rose-500/40 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overdue Items</span>
            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{overdueCount}</div>
          <div className="mt-2 text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
            <span>{overdueCount > 0 ? 'Escalations triggered' : 'Zero overdue items'}</span>
          </div>
        </div>
      </div>

      {/* Active Requisition / Booking Highlight for Student */}
      {activeBooking && (
        <div className="rounded-3xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200/90 dark:border-indigo-500/30 p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30">
                <Clock className="w-3.5 h-3.5" />
                <span>Your Active Equipment Checkout</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeBooking.equipment?.name || `Equipment #${activeBooking.equipment_id}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Due by: <span className="text-slate-900 dark:text-white font-semibold">{new Date(activeBooking.end_time).toLocaleString()}</span>
              </p>
            </div>
            <Link
              to="/my-bookings"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-semibold shadow-sm shadow-sky-600/20 transition flex items-center gap-1.5"
            >
              <span>View Booking Details & Status</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Lab Assistant Pending Queue Action Card */}
      {(user?.role === 'lab_assistant' || user?.role === 'admin') && queueBookings.length > 0 && (
        <div className="rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {queueBookings.length} Requisition(s) Awaiting Review
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Students have submitted academic justifications requiring faculty or lab assistant approval.
                </p>
              </div>
            </div>
            <Link
              to="/assistant/queue"
              className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              Process Queue
            </Link>
          </div>
        </div>
      )}

      {/* Featured Hardware Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Featured Academic Resources</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Top shared hardware available across campus facilities</p>
          </div>
          <Link
            to="/directory"
            className="text-xs text-sky-600 dark:text-indigo-400 hover:text-sky-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
          >
            <span>View all inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {equipmentList.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_36px_-4px_rgba(2,132,199,0.12)] hover:border-sky-300/60 transition duration-300 flex flex-col group"
            >
              <div className="h-44 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-95 dark:opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-700">
                    <Cpu className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                      item.status === 'available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                        : item.status === 'booked'
                        ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40'
                        : item.status === 'issued'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-sky-600 dark:text-indigo-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-sky-600 dark:group-hover:text-indigo-300 transition line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Lab: {item.lab?.name || 'Main Lab'}
                  </span>
                  <Link
                    to={`/calendar?equipment_id=${item.id}`}
                    className="px-4 py-1.5 rounded-full bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white dark:bg-indigo-600/20 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white text-xs font-semibold border border-sky-200 dark:border-indigo-500/30 transition shadow-sm"
                  >
                    Reserve Slot
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
