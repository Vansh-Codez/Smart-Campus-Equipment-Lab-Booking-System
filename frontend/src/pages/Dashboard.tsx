import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Equipment, Booking } from '../types';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  FlaskConical,
  Layers3,
  PackageCheck,
  RotateCw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';

const statusTone = (status: string) => {
  if (status === 'available') return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30';
  if (status === 'booked') return 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30';
  if (status === 'issued') return 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30';
  return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30';
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [queueBookings, setQueueBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [equipment, bookings] = await Promise.all([api.getEquipment(), api.getMyBookings().catch(() => [])]);
        setEquipmentList(equipment);
        setMyBookings(bookings);
        if (user?.role === 'lab_assistant' || user?.role === 'admin') {
          setQueueBookings(await api.getQueue('pending').catch(() => []));
        } else {
          setQueueBookings([]);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const activeBooking = useMemo(() => myBookings.find((booking) => ['checked_out', 'approved'].includes(booking.status)), [myBookings]);
  const stats = [
    { label: 'Available now', value: equipmentList.filter((item) => item.status === 'available').length, note: 'Ready for reservation', icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300' },
    { label: 'Active reservations', value: equipmentList.filter((item) => ['issued', 'booked'].includes(item.status)).length, note: 'In use across campus', icon: Clock3, tone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300' },
    { label: 'In maintenance', value: equipmentList.filter((item) => item.status === 'under_maintenance').length, note: 'Calibration or repair', icon: RotateCw, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300' },
    { label: 'Overdue items', value: equipmentList.filter((item) => item.status === 'overdue').length, note: equipmentList.some((item) => item.status === 'overdue') ? 'Needs attention' : 'Everything on track', icon: TriangleAlert, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300' },
  ];

  const firstName = user?.name?.split(' ')[0] || 'there';
  const roleCopy = user?.role === 'student'
    ? 'Find the right resource, choose a clear time window, and keep your academic work moving.'
    : user?.role === 'lab_assistant'
      ? 'Keep requisitions moving, make handoffs clear, and keep every resource ready for the next session.'
      : 'See the pulse of campus infrastructure and make informed decisions from one operational workspace.';

  return (
    <div className="page-container space-y-7">
      <section className="relative overflow-hidden rounded-[1.65rem] border border-indigo-300/25 bg-[#121936] px-6 py-7 text-white shadow-[0_28px_70px_-34px_rgba(49,46,129,0.85)] sm:px-9 sm:py-9">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_310px] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-indigo-100">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Academic term 2026–27
            </div>
            <h1 className="text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">Good to see you, <span className="bg-gradient-to-r from-cyan-200 via-indigo-200 to-white bg-clip-text text-transparent">{firstName}.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100/75">{roleCopy}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/directory" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-indigo-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-indigo-50"><Layers3 className="h-4 w-4 text-indigo-600" /> Explore resources <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              <Link to="/calendar" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"><CalendarDays className="h-4 w-4 text-cyan-200" /> Book a time slot</Link>
              {(user?.role === 'lab_assistant' || user?.role === 'admin') && <Link to="/assistant/queue" className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-400/15 px-4 py-2.5 text-xs font-bold text-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-400/25"><PackageCheck className="h-4 w-4" /> Queue <span className="rounded-full bg-emerald-300/20 px-1.5 py-0.5">{queueBookings.length}</span></Link>}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
              <div className="flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-[0.14em] text-indigo-200/70"><span>Campus pulse</span><span className="flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Live</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/15 p-3"><FlaskConical className="h-4 w-4 text-cyan-200" /><div className="mt-4 text-2xl font-extrabold">{equipmentList.length}</div><div className="mt-0.5 text-[0.65rem] text-indigo-100/60">Total resources</div></div>
                <div className="rounded-xl bg-black/15 p-3"><Cpu className="h-4 w-4 text-indigo-200" /><div className="mt-4 text-2xl font-extrabold">{myBookings.length}</div><div className="mt-0.5 text-[0.65rem] text-indigo-100/60">Your bookings</div></div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[0.67rem] text-indigo-100/70"><span className="h-2 w-2 rounded-full bg-cyan-300" /> Inventory and slots sync in real time</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map(({ label, value, note, icon: Icon, tone }) => (
          <div className="metric-card" key={label}>
            <div className="flex items-start justify-between gap-2"><span className="text-[0.68rem] font-bold leading-4 text-slate-500 dark:text-slate-400">{label}</span><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span></div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{loading ? '—' : value}</div>
            <div className="mt-1 text-[0.65rem] font-semibold text-slate-400 dark:text-slate-500">{note}</div>
          </div>
        ))}
      </section>

      {(activeBooking || ((user?.role === 'lab_assistant' || user?.role === 'admin') && queueBookings.length > 0)) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {activeBooking && <div className="surface flex items-center justify-between gap-4 p-5"><div className="min-w-0"><div className="eyebrow"><Clock3 className="h-3.5 w-3.5" /> Your active reservation</div><h2 className="mt-2 truncate text-lg font-extrabold text-slate-900 dark:text-white">{activeBooking.equipment?.name || `Equipment #${activeBooking.equipment_id}`}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Due {new Date(activeBooking.end_time).toLocaleString()}</p></div><Link to="/my-bookings" className="btn-secondary shrink-0 px-3 py-2 text-[0.68rem]">Details <ChevronRight className="h-3.5 w-3.5" /></Link></div>}
          {(user?.role === 'lab_assistant' || user?.role === 'admin') && queueBookings.length > 0 && <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-amber-200 bg-amber-50/75 p-5 dark:border-amber-500/25 dark:bg-amber-500/10"><div><div className="eyebrow !text-amber-600 dark:!text-amber-300"><PackageCheck className="h-3.5 w-3.5" /> Needs your review</div><h2 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{queueBookings.length} requisition{queueBookings.length === 1 ? '' : 's'} waiting</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Clear the queue before the next lab session.</p></div><Link to="/assistant/queue" className="btn-primary shrink-0 !border-amber-500 !bg-amber-500 !text-slate-950 !shadow-amber-500/20">Review <ChevronRight className="h-3.5 w-3.5" /></Link></div>}
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><div className="eyebrow"><Layers3 className="h-3.5 w-3.5" /> Shared inventory</div><h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">Start with what you need</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">A quick view of resources available across campus labs.</p></div><Link to="/directory" className="hidden items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 sm:flex dark:text-indigo-300">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
        {loading ? <div className="grid gap-4 md:grid-cols-3"><div className="surface h-72 animate-pulse" /><div className="surface h-72 animate-pulse" /><div className="surface h-72 animate-pulse" /></div> : <div className="grid gap-4 md:grid-cols-3">{equipmentList.slice(0, 3).map((item) => <article key={item.id} className="surface group overflow-hidden transition hover:-translate-y-1 hover:border-indigo-300/60 dark:hover:border-indigo-500/40"><div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-950">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="grid h-full place-items-center bg-gradient-to-br from-indigo-50 to-cyan-50 text-indigo-300 dark:from-indigo-950/40 dark:to-cyan-950/30"><Cpu className="h-12 w-12" /></div>}<span className={`status-badge absolute right-3 top-3 ${statusTone(item.status)}`}>{item.status.replace('_', ' ')}</span></div><div className="p-5"><div className="text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-indigo-500 dark:text-indigo-300">{item.category}</div><h3 className="mt-1.5 truncate text-base font-extrabold text-slate-900 dark:text-white">{item.name}</h3><p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description || 'Ready for academic use across campus.'}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800"><span className="max-w-[55%] truncate text-[0.68rem] font-semibold text-slate-400">{item.lab?.name || 'Academic lab'}</span><Link to={`/calendar?equipment_id=${item.id}`} className="inline-flex items-center gap-1 text-[0.7rem] font-extrabold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300">Reserve <ChevronRight className="h-3.5 w-3.5" /></Link></div></div></article>)}</div>}
        <Link to="/directory" className="btn-secondary mt-4 w-full sm:hidden">View full resource library <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </section>
    </div>
  );
};
