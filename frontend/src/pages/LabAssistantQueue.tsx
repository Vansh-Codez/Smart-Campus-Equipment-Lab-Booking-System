import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Booking } from '../types';
import { useWebSocket } from '../context/WebSocketContext';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  AlertTriangle,
  Upload,
  Camera,
  FileText,
  User as UserIcon,
  X,
  Wrench,
} from 'lucide-react';

export const LabAssistantQueue: React.FC = () => {
  const [queue, setQueue] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');

  // Modals
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [assistantNotes, setAssistantNotes] = useState('');

  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [checkoutCondition, setCheckoutCondition] = useState('Tested OK, cables & accessories included');
  const [checkoutPhoto, setCheckoutPhoto] = useState('');

  const [checkinBooking, setCheckinBooking] = useState<Booking | null>(null);
  const [checkinCondition, setCheckinCondition] = useState('Returned in verified working condition');
  const [isDamaged, setIsDamaged] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const { lastEvent } = useWebSocket();

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getQueue(activeTab);
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  useEffect(() => {
    if (
      lastEvent &&
      (lastEvent.type === 'SLOT_BOOKED' ||
        lastEvent.type === 'BOOKING_REVIEWED' ||
        lastEvent.type === 'EQUIPMENT_CHECKED_OUT' ||
        lastEvent.type === 'EQUIPMENT_RETURNED' ||
        lastEvent.type === 'BOOKING_CANCELLED')
    ) {
      fetchQueue();
    }
  }, [lastEvent]);

  // Handle Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    try {
      setSubmitting(true);
      await api.reviewBooking(reviewBooking.id, {
        status: reviewDecision,
        assistant_notes: assistantNotes.trim() || undefined,
      });
      setReviewBooking(null);
      setAssistantNotes('');
      await fetchQueue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Check-Out
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutBooking) return;
    try {
      setSubmitting(true);
      await api.checkoutBooking(checkoutBooking.id, {
        check_out_condition: checkoutCondition,
        check_out_photo: checkoutPhoto.trim() || undefined,
      });
      setCheckoutBooking(null);
      setCheckoutCondition('Tested OK, cables & accessories included');
      setCheckoutPhoto('');
      await fetchQueue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Check-In / Return
  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinBooking) return;
    try {
      setSubmitting(true);
      await api.checkinBooking(checkinBooking.id, {
        check_in_condition: checkinCondition,
        is_damaged: isDamaged,
        damage_description: isDamaged ? damageDescription : undefined,
      });
      setCheckinBooking(null);
      setIsDamaged(false);
      setDamageDescription('');
      await fetchQueue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Lab Assistant Requisitions Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review incoming student requisitions, inspect physical condition, issue equipment, and process returns.
          </p>
        </div>

        {/* Tab Switcher - Rounded Pill Container */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-white'
            }`}
          >
            Pending Requisitions
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-white'
            }`}
          >
            Active Checkouts & Returns
          </button>
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={activeTab === 'pending' ? 'All Clear! No Pending Requests' : 'No Active Checkouts'}
          description={
            activeTab === 'pending'
              ? 'There are currently no requisitions waiting for review in the queue.'
              : 'There are no active approved or issued equipment items in this lab.'
          }
        />
      ) : (
        <div className="space-y-4">
          {queue.map((item) => {
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            const isCheckedOut = item.status === 'checked_out';
            const isOverdue = item.status === 'overdue';

            return (
              <div
                key={item.id}
                className="rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-sky-300/60 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-sky-600 dark:text-indigo-400">
                        Requisition #{item.id}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          isPending
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                            : isApproved
                            ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
                            : isCheckedOut
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 animate-pulse'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Requested by: <strong className="text-slate-800 dark:text-slate-200">{item.user?.name}</strong> ({item.user?.department || 'Student'}{item.user?.enrollment_no ? ` • ${item.user.enrollment_no}` : ''})
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.equipment?.name || `Equipment #${item.equipment_id}`}
                    </h3>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-4">
                      <span>
                        Slot: {new Date(item.start_time).toLocaleString()} - {new Date(item.end_time).toLocaleString()}
                      </span>
                      <span>Lab: {item.equipment?.lab?.name || 'Lab'}</span>
                    </div>
                  </div>

                  {/* Actions - Pill Styled */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {isPending && (
                      <button
                        onClick={() => {
                          setReviewBooking(item);
                          setReviewDecision('approved');
                          setAssistantNotes('');
                        }}
                        className="px-5 py-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-semibold shadow-sm shadow-sky-600/20 transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Review & Decide</span>
                      </button>
                    )}

                    {isApproved && (
                      <button
                        onClick={() => {
                          setCheckoutBooking(item);
                          setCheckoutCondition('Normal condition, no visible faults. Accessories handed over.');
                        }}
                        className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Perform Check-Out</span>
                      </button>
                    )}

                    {(isCheckedOut || isOverdue) && (
                      <button
                        onClick={() => {
                          setCheckinBooking(item);
                          setIsDamaged(false);
                          setDamageDescription('');
                          setCheckinCondition('Returned in verified working condition');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Log Return / Inspect</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Justification Box - Elevated Light & Dark Container */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-indigo-400" />
                    <span>Academic Justification:</span>
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">{item.justification}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Review Requisition #{reviewBooking.id}
              </h3>
              <button onClick={() => setReviewBooking(null)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p><strong>Resource:</strong> {reviewBooking.equipment?.name}</p>
              <p><strong>Student:</strong> {reviewBooking.user?.name} ({reviewBooking.user?.department})</p>
              <p><strong>Justification:</strong> {reviewBooking.justification}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Action Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('approved')}
                    className={`py-2 px-3 rounded-full text-xs font-bold border transition ${
                      reviewDecision === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm dark:bg-emerald-600 dark:text-white dark:border-transparent'
                        : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('rejected')}
                    className={`py-2 px-3 rounded-full text-xs font-bold border transition ${
                      reviewDecision === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm dark:bg-rose-600 dark:text-white dark:border-transparent'
                        : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assistant Comments / Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={assistantNotes}
                  onChange={(e) => setAssistantNotes(e.target.value)}
                  placeholder="e.g. Approved. Please pick up kit at Bay B before 10 AM..."
                  className="w-full p-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-semibold shadow-sm transition"
                >
                  {submitting ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-Out Modal */}
      {checkoutBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Check-Out Inspection #{checkoutBooking.id}
              </h3>
              <button onClick={() => setCheckoutBooking(null)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p><strong>Item:</strong> {checkoutBooking.equipment?.name}</p>
              <p><strong>Issuing To:</strong> {checkoutBooking.user?.name}</p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condition Notes at Handover
                </label>
                <textarea
                  rows={3}
                  required
                  value={checkoutCondition}
                  onChange={(e) => setCheckoutCondition(e.target.value)}
                  placeholder="Record cosmetic state, power adapters, accessories handed over..."
                  className="w-full p-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photo Verification URL (Optional)
                </label>
                <div className="relative">
                  <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    value={checkoutPhoto}
                    onChange={(e) => setCheckoutPhoto(e.target.value)}
                    placeholder="https://campus-storage.edu/photos/checkout-123.jpg"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutBooking(null)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Issuing...' : 'Complete Check-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return / Inspection Modal */}
      {checkinBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Return Inspection & Check-In #{checkinBooking.id}
              </h3>
              <button onClick={() => setCheckinBooking(null)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p><strong>Item:</strong> {checkinBooking.equipment?.name}</p>
              <p><strong>Returned by:</strong> {checkinBooking.user?.name}</p>
            </div>

            <form onSubmit={handleCheckinSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Return Condition Inspection
                </label>
                <textarea
                  rows={3}
                  required
                  value={checkinCondition}
                  onChange={(e) => setCheckinCondition(e.target.value)}
                  placeholder="Record inspection details, power test results, serial number check..."
                  className="w-full p-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                />
              </div>

              {/* Damage Flag Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDamaged}
                    onChange={(e) => setIsDamaged(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Flag Damage / Malfunction (Triggers Maintenance)</span>
                  </span>
                </label>

                {isDamaged && (
                  <div className="pt-2 animate-fade-in">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Damage Issue Description
                    </label>
                    <textarea
                      rows={2}
                      required={isDamaged}
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                      placeholder="Describe broken component, motor faults, missing parts..."
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-500/40 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckinBooking(null)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 rounded-full text-white text-xs font-semibold shadow-sm transition ${
                    isDamaged
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  {submitting
                    ? 'Processing...'
                    : isDamaged
                    ? 'Log Damage & Send to Maintenance'
                    : 'Approve Clean Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
