import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Equipment, Lab, Lifecycle, EQUIPMENT_CATEGORIES } from '../types';
import { useWebSocket } from '../context/WebSocketContext';
import { CardSkeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import {
  Search,
  SlidersHorizontal,
  Cpu,
  Calendar,
  Layers,
  History,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Building,
  Hash,
} from 'lucide-react';

export const Directory: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLab, setSelectedLab] = useState<string>('All');
  const [detailItem, setDetailItem] = useState<Equipment | null>(null);
  const [lifecycles, setLifecycles] = useState<Lifecycle[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { lastEvent } = useWebSocket();

  const categories = EQUIPMENT_CATEGORIES;

  const statuses = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Available', value: 'available' },
    { label: 'Booked', value: 'booked' },
    { label: 'Issued', value: 'issued' },
    { label: 'Under Maintenance', value: 'under_maintenance' },
    { label: 'Overdue', value: 'overdue' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eqData, labData] = await Promise.all([
        api.getEquipment({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          status: selectedStatus !== 'All' ? selectedStatus : undefined,
          lab_id: selectedLab !== 'All' ? Number(selectedLab) : undefined,
          search: search.trim() ? search : undefined,
        }),
        api.getLabs(),
      ]);
      setEquipment(eqData);
      setLabs(labData);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedStatus, selectedLab]);

  // Real-time update listener
  useEffect(() => {
    if (
      lastEvent &&
      (lastEvent.type === 'EQUIPMENT_STATUS_CHANGED' ||
        lastEvent.type === 'EQUIPMENT_CREATED' ||
        lastEvent.type === 'EQUIPMENT_DELETED' ||
        lastEvent.type === 'EQUIPMENT_RETURNED' ||
        lastEvent.type === 'EQUIPMENT_CHECKED_OUT')
    ) {
      fetchData();
    }
  }, [lastEvent]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenDetail = async (item: Equipment) => {
    setDetailItem(item);
    try {
      setLoadingHistory(true);
      const history = await api.getEquipmentLifecycles(item.id);
      setLifecycles(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Equipment & Lab Directory
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search and filter all academic hardware, sensors, computing servers, and lab benches across campus.
        </p>
      </div>

      {/* Filter Bar & Category Tabs */}
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition duration-150 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md shadow-sky-600/25 border border-sky-500'
                  : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-slate-200 hover:border-sky-300 border border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, specs, model, or serial number..."
              className="w-full pl-10 pr-24 py-2.5 text-xs bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-full text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-full text-xs font-semibold shadow-sm transition"
            >
              Search
            </button>
          </form>

          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2.5 px-4 text-xs bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-full text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              className="w-full py-2.5 px-4 text-xs bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-full text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            >
              <option value="All">All Campus Labs ({labs.length})</option>
              <optgroup label="BVS Block (7 Labs)">
                {labs
                  .filter((l) => l.location?.includes('BVS'))
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.location.split(',')[1]?.trim() || l.location}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="MMS Block (13 Labs)">
                {labs
                  .filter((l) => l.location?.includes('MMS'))
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.location.split(',')[1]?.trim() || l.location}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : equipment.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Equipment Matches"
          description="We couldn't find any equipment matching your current filters. Try changing your search query or reset filters."
          actionText="Reset All Filters"
          onAction={() => {
            setSelectedCategory('All');
            setSelectedStatus('All');
            setSelectedLab('All');
            setSearch('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_36px_-4px_rgba(2,132,199,0.12)] hover:border-sky-300/70 transition duration-300 flex flex-col group"
            >
              {/* Card Image Banner */}
              <div className="h-48 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-95 dark:opacity-90"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-700">
                    <Cpu className="w-12 h-12" />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                      item.status === 'available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                        : item.status === 'booked'
                        ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40'
                        : item.status === 'issued'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40'
                        : item.status === 'overdue'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-semibold shadow-sm">
                  {item.category}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-indigo-300 transition line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description || 'No description provided.'}
                  </p>

                  {item.specs && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/60 line-clamp-2 font-mono">
                      {item.specs}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 truncate max-w-[220px]" title={`${item.lab?.name} (${item.lab?.location})`}>
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">{item.lab?.name || 'Lab Location'}</span>
                      {item.lab?.location && (
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-full shrink-0 ${
                            item.lab.location.includes('BVS')
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                              : 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20'
                          }`}
                        >
                          {item.lab.location.includes('BVS') ? 'BVS' : 'MMS'} • {item.lab.location.split(',')[1]?.replace('Floor', 'Fl').trim() || ''}
                        </span>
                      )}
                    </span>
                    {item.serial_number && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        SN: {item.serial_number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="flex-1 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-transparent text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <History className="w-3.5 h-3.5 text-sky-600 dark:text-indigo-400" />
                      <span>Audit & Specs</span>
                    </button>

                    <Link
                      to={`/calendar?equipment_id=${item.id}`}
                      className={`flex-1 py-2 rounded-full text-xs font-semibold text-center transition flex items-center justify-center gap-1.5 shadow-sm ${
                        item.status === 'under_maintenance'
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed pointer-events-none'
                          : 'bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white shadow-sky-600/20'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.status === 'under_maintenance' ? 'In Repair' : 'Book Slot'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Modal with Lifecycle State Machine Audit */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {detailItem.image_url && (
              <div className="h-48 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative border-b border-slate-200 dark:border-slate-800 shrink-0">
                <img
                  src={detailItem.image_url}
                  alt={detailItem.name}
                  className="w-full h-full object-cover opacity-95 dark:opacity-90"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent dark:from-slate-900 dark:via-slate-900/30" />
                <button
                  onClick={() => setDetailItem(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 dark:bg-slate-950/70 dark:hover:bg-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 backdrop-blur-md transition z-10 shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{detailItem.name}</h3>
                <span className="text-xs text-sky-600 dark:text-indigo-400 font-semibold">{detailItem.category}</span>
              </div>
              {!detailItem.image_url && (
                <button
                  onClick={() => setDetailItem(null)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Specs & Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block mb-1 font-semibold">Location / Lab</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">{detailItem.lab?.name || 'Academic Lab'}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{detailItem.lab?.location}</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block mb-1 font-semibold">Current Lifecycle Status</span>
                  <span className="font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {detailItem.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {detailItem.specs && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Hardware Specifications
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {detailItem.specs}
                  </div>
                </div>
              )}

              {/* Lifecycle State Machine Audit Trail */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                  <span>State Machine Lifecycle Audit Trail</span>
                </h4>

                {loadingHistory ? (
                  <div className="text-center py-6 text-xs text-slate-400">Loading audit trail...</div>
                ) : lifecycles.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">No audit records yet.</div>
                ) : (
                  <div className="space-y-2.5">
                    {lifecycles.map((lc) => (
                      <div
                        key={lc.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                lc.state === 'available'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
                                  : lc.state === 'issued'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-cyan-500/20 dark:text-cyan-400'
                                  : lc.state === 'booked'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-indigo-500/20 dark:text-indigo-400'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400'
                              }`}
                            >
                              {lc.state}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 font-medium">By: {lc.updated_by}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">{lc.notes}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                          {new Date(lc.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setDetailItem(null)}
                className="px-5 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-sm"
              >
                Close
              </button>
              <Link
                to={`/calendar?equipment_id=${detailItem.id}`}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-semibold shadow-sm transition"
              >
                Book This Resource
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
