import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Booking } from '../types';
import { useWebSocket } from '../context/WebSocketContext';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const { lastEvent } = useWebSocket();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (
      lastEvent &&
      (lastEvent.type === 'BOOKING_REVIEWED' ||
        lastEvent.type === 'EQUIPMENT_CHECKED_OUT' ||
        lastEvent.type === 'EQUIPMENT_RETURNED' ||
        lastEvent.type === 'BOOKING_CANCELLED')
    ) {
      fetchBookings();
    }
  }, [lastEvent]);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking reservation?')) return;
    try {
      setCancellingId(id);
      await api.cancelBooking(id);
      await fetchBookings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved (Ready for Pickup)</span>
          </span>
        );
      case 'checked_out':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>Issued / In Hand</span>
          </span>
        );
      case 'returned':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Returned & Inspected</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>OVERDUE</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Bookings & Reservations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track equipment requisitions, pickup approvals, check-out condition reports, and return deadlines.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'pending', 'approved', 'checked_out', 'returned', 'overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md shadow-sky-600/25 border border-sky-500'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              {st.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / Cards */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Bookings Found"
          description={
            statusFilter === 'all'
              ? 'You have not made any equipment reservations yet.'
              : `No bookings matching the '${statusFilter}' status.`
          }
          actionText="Browse Equipment Directory"
          onAction={() => (window.location.href = '/directory')}
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isCheckedOut = b.status === 'checked_out';
            const isOverdue = b.status === 'overdue';
            const canCancel = b.status === 'pending' || b.status === 'approved';
            const endDt = new Date(b.end_time);
            const now = new Date();
            const diffHours = Math.round((endDt.getTime() - now.getTime()) / (1000 * 60 * 60));

            return (
              <div
                key={b.id}
                className="rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-sky-300/60 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-sky-600 dark:text-indigo-400 font-bold">
                        Requisition #{b.id}
                      </span>
                      {getStatusBadge(b.status)}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Requested: {new Date(b.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {b.equipment?.name || `Equipment #${b.equipment_id}`}
                    </h3>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        Start: <strong className="text-slate-800 dark:text-slate-200">{new Date(b.start_time).toLocaleString()}</strong>
                      </span>
                      <span>
                        End / Deadline:{' '}
                        <strong className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                          {new Date(b.end_time).toLocaleString()}
                        </strong>
                      </span>
                      <span>Lab: {b.equipment?.lab?.name || 'Assigned Lab'}</span>
                    </div>
                  </div>

                  {/* Right Actions & Countdown */}
                  <div className="flex items-center gap-3 self-start md:self-auto">
                    {isCheckedOut && (
                      <div
                        className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${
                          diffHours <= 24
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300 animate-pulse'
                            : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{diffHours > 0 ? `${diffHours}h remaining` : 'Return due now'}</span>
                      </div>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        className="px-4 py-1.5 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold border border-slate-200 hover:border-rose-200 dark:bg-slate-800 dark:hover:bg-rose-900/40 dark:text-slate-400 dark:hover:text-rose-300 dark:border-slate-700 transition shadow-sm"
                      >
                        {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Justification & Staff Remarks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-indigo-400" />
                      Academic Justification
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{b.justification}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Lab Assistant Remarks & Condition
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {b.assistant_notes || b.check_out_condition || 'No remarks logged yet.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
