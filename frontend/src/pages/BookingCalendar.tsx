import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Equipment, Lab, Booking } from '../types';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Info,
  Radio,
  FileText,
  Building,
} from 'lucide-react';

export const BookingCalendar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, lastEvent } = useWebSocket();

  const preselectedEqId = searchParams.get('equipment_id');

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>('all');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(
    preselectedEqId ? Number(preselectedEqId) : null
  );

  // Date selection
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [slots, setSlots] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // New Booking Form fields
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [justification, setJustification] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch equipment and labs
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [eq, lb] = await Promise.all([api.getEquipment(), api.getLabs()]);
        setEquipmentList(eq);
        setLabs(lb);
        if (!selectedEquipmentId && eq.length > 0) {
          setSelectedEquipmentId(eq[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch slots whenever selected equipment changes or date changes
  const fetchSlots = async () => {
    if (!selectedEquipmentId) return;
    try {
      setLoading(true);
      const data = await api.getCalendarSlots({
        equipment_id: selectedEquipmentId,
      });
      setSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedEquipmentId]);

  // Real-time live update on WebSocket events
  useEffect(() => {
    if (
      lastEvent &&
      (lastEvent.type === 'SLOT_BOOKED' ||
        lastEvent.type === 'BOOKING_REVIEWED' ||
        lastEvent.type === 'BOOKING_CANCELLED' ||
        lastEvent.type === 'EQUIPMENT_CHECKED_OUT' ||
        lastEvent.type === 'EQUIPMENT_RETURNED')
    ) {
      fetchSlots();
    }
  }, [lastEvent]);

  const selectedEquipment = equipmentList.find((e) => e.id === selectedEquipmentId);

  // Filter slots for the selected date
  const dayBookings = slots.filter((b) => {
    const bDate = b.start_time.split('T')[0];
    return bDate === selectedDate;
  });

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!selectedEquipmentId) {
      setFormError('Please select equipment to reserve.');
      return;
    }

    if (!justification || justification.trim().length < 10) {
      setFormError('Academic justification must be at least 10 characters detailing course/research purpose.');
      return;
    }

    const startDateTime = `${selectedDate}T${startTime}:00`;
    const endDateTime = `${selectedDate}T${endTime}:00`;

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      setFormError('Slot end time must be after start time.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createBooking({
        equipment_id: selectedEquipmentId,
        start_time: startDateTime,
        end_time: endDateTime,
        justification: justification.trim(),
      });

      setSuccessMsg(
        user?.role === 'student'
          ? `Booking requisition #${res.id} submitted! Awaiting Lab Assistant review.`
          : `Booking reserved & approved instantly!`
      );
      setJustification('');
      fetchSlots();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate hourly time blocks for visual slot preview
  const timeBlocks = [
    { start: '08:00', end: '10:00', label: '08:00 AM - 10:00 AM' },
    { start: '10:00', end: '12:00', label: '10:00 AM - 12:00 PM' },
    { start: '12:00', end: '14:00', label: '12:00 PM - 02:00 PM' },
    { start: '14:00', end: '16:00', label: '02:00 PM - 04:00 PM' },
    { start: '16:00', end: '18:00', label: '04:00 PM - 06:00 PM' },
    { start: '18:00', end: '20:00', label: '06:00 PM - 08:00 PM' },
  ];

  const isBlockBooked = (blockStart: string, blockEnd: string) => {
    const blockStartDt = new Date(`${selectedDate}T${blockStart}:00`);
    const blockEndDt = new Date(`${selectedDate}T${blockEnd}:00`);

    return dayBookings.find((b) => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return bStart < blockEndDt && bEnd > blockStartDt;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with live sync pulse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Live Slot Booking Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time conflict-free reservation engine with live WebSocket slot synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
          <span className="font-semibold">{isConnected ? 'Live WebSocket Connected' : 'Connecting to Hub...'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Equipment Picker & Real-Time Schedule */}
        <div className="lg:col-span-7 space-y-6">
          {/* Equipment & Date Selectors */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Select Hardware Resource</label>
                <select
                  value={selectedEquipmentId || ''}
                  onChange={(e) => setSelectedEquipmentId(Number(e.target.value))}
                  className="w-full py-2.5 px-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                >
                  {equipmentList.map((eq) => {
                    const loc = eq.lab?.location ? ` (${eq.lab.location})` : '';
                    return (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} — {eq.lab?.name || eq.category}{loc}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Calendar Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                >
                </input>
              </div>
            </div>

            {/* Selected Resource Overview */}
            {selectedEquipment && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-indigo-500/10 border border-sky-200 dark:border-indigo-500/20 text-sky-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedEquipment.name}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                      {selectedEquipment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{selectedEquipment.specs || selectedEquipment.description}</p>
                  <div className="flex items-center gap-4 text-slate-500 pt-1">
                    <span>
                      Lab: {selectedEquipment.lab?.name || 'Academic Lab'}
                      {selectedEquipment.lab?.location && (
                        <span className="text-slate-700 dark:text-slate-400 font-medium"> ({selectedEquipment.lab.location})</span>
                      )}
                    </span>
                    {selectedEquipment.serial_number && <span>SN: {selectedEquipment.serial_number}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Visual Daily Timeline Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-sky-600 dark:text-indigo-400" />
                <span>Slot Timeline for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {dayBookings.length} reserved block(s)
              </span>
            </div>

            {/* Time Blocks Visualizer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {timeBlocks.map((block, idx) => {
                const conflict = isBlockBooked(block.start, block.end);
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!conflict) {
                        setStartTime(block.start);
                        setEndTime(block.end);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition duration-200 cursor-pointer ${
                      conflict
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 cursor-not-allowed text-slate-500 dark:text-slate-400'
                        : 'bg-white dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/80 hover:border-sky-400 dark:hover:border-indigo-500/50 hover:bg-sky-50/40 text-slate-900 dark:text-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{block.label}</span>
                      {conflict ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
                          {conflict.status.toUpperCase()}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500">
                      {conflict ? (
                        <span>Reserved by: {conflict.user?.name || `User #${conflict.user_id}`}</span>
                      ) : (
                        <span className="text-sky-600 dark:text-indigo-400 font-semibold">Click to select this slot</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Reservation Requisition Submission */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] sticky top-24 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
                <span>Reserve Time Slot</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Backend conflict validator prevents double-booking and locks slot upon submission.
              </p>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Equipment</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedEquipment?.name || 'No equipment chosen'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-indigo-400" />
                    <span>Academic Justification (Required)</span>
                  </label>
                  <span className={`text-[10px] ${justification.length < 10 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {justification.length} / 10 chars min
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Specify course code, thesis topic, or research paper objective (e.g. CS684 Deep Learning Lab: Fine-tuning Llama-3 model for autonomous drone navigation)..."
                  className="w-full p-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xs shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition duration-200"
              >
                <span>{submitting ? 'Validating Conflicts...' : 'Submit Booking Request'}</span>
              </button>

              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                {user?.role === 'student'
                  ? 'Requisitions from students require approval from a Lab Assistant or Faculty member before check-out.'
                  : 'Faculty and Staff bookings are pre-authorized upon submission.'}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
