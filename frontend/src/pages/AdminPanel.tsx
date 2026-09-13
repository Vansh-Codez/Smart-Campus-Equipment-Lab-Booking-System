import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  AnalyticsDashboard,
  Equipment,
  Lab,
  User,
  MaintenanceLog,
  StudentRecord,
  ACADEMIC_DEPARTMENTS,
  EQUIPMENT_CATEGORIES,
} from '../types';
import { useWebSocket } from '../context/WebSocketContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  Layers,
  Building,
  Users,
  Wrench,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  X,
  Cpu,
  ShieldCheck,
  Percent,
  Search,
  Check,
  UserCheck,
  UserX,
  BookOpen,
  CreditCard,
  GraduationCap,
  FileCheck,
  HelpCircle,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'equipment' | 'labs' | 'users' | 'maintenance'>('analytics');

  // Analytics Data
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Master Inventory
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);

  // Users & Access State
  const [userSubTab, setUserSubTab] = useState<'pending' | 'all' | 'registry'>('pending');
  const [userSearch, setUserSearch] = useState('');
  const [registrySearch, setRegistrySearch] = useState('');
  const [approvingUserId, setApprovingUserId] = useState<number | null>(null);

  // Student Record Modal
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [newRecEnroll, setNewRecEnroll] = useState('');
  const [newRecName, setNewRecName] = useState('');
  const [newRecDept, setNewRecDept] = useState<string>(ACADEMIC_DEPARTMENTS[0]);
  const [newRecBatch, setNewRecBatch] = useState('2024-2028');
  const [newRecStatus, setNewRecStatus] = useState('Active Enrolled');

  // Modals
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEqName, setNewEqName] = useState('');
  const [newEqCategory, setNewEqCategory] = useState<string>(EQUIPMENT_CATEGORIES[1]);
  const [newEqDescription, setNewEqDescription] = useState('');
  const [newEqLabId, setNewEqLabId] = useState<number>(1);
  const [newEqSerial, setNewEqSerial] = useState('');
  const [newEqSpecs, setNewEqSpecs] = useState('');
  const [newEqImage, setNewEqImage] = useState('');

  const [showAddLab, setShowAddLab] = useState(false);
  const [newLabName, setNewLabName] = useState('');
  const [newLabLocation, setNewLabLocation] = useState('');
  const [newLabCapacity, setNewLabCapacity] = useState(30);
  const [newLabDepartment, setNewLabDepartment] = useState<string>(ACADEMIC_DEPARTMENTS[0]);
  const [newLabDesc, setNewLabDesc] = useState('');

  // Maintenance Resolve Modal
  const [resolvingMaint, setResolvingMaint] = useState<MaintenanceLog | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveCost, setResolveCost] = useState<number>(0);

  const { lastEvent } = useWebSocket();

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await api.getAnalyticsDashboard();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const [eqData, labData, userData, maintData, recData] = await Promise.all([
        api.getEquipment(),
        api.getLabs(),
        api.getUsers(),
        api.getMaintenance(),
        api.getStudentRecords(),
      ]);
      setEquipment(eqData);
      setLabs(labData);
      setUsers(userData);
      setMaintenance(maintData);
      setStudentRecords(recData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchInventory();
  }, []);

  useEffect(() => {
    if (lastEvent) {
      fetchAnalytics();
      fetchInventory();
    }
  }, [lastEvent]);

  // Create Equipment
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEquipment({
        name: newEqName,
        category: newEqCategory,
        description: newEqDescription,
        lab_id: newEqLabId,
        serial_number: newEqSerial.trim() || undefined,
        specs: newEqSpecs.trim() || undefined,
        image_url: newEqImage.trim() || undefined,
      });
      setShowAddEquipment(false);
      setNewEqName('');
      setNewEqSerial('');
      setNewEqSpecs('');
      setNewEqDescription('');
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Equipment
  const handleDeleteEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to decommission and delete this equipment?')) return;
    try {
      await api.deleteEquipment(id);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Lab
  const handleAddLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLab({
        name: newLabName,
        location: newLabLocation,
        capacity: newLabCapacity,
        department: newLabDepartment,
        description: newLabDesc,
      });
      setShowAddLab(false);
      setNewLabName('');
      setNewLabLocation('');
      setNewLabDesc('');
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Lab
  const handleDeleteLab = async (id: number) => {
    if (!confirm('Delete this lab? Equipment assigned to this lab will also be removed.')) return;
    try {
      await api.deleteLab(id);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // User Management Handlers
  const handleUpdateRole = async (userId: number, role: string) => {
    try {
      await api.updateUserRole(userId, role);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveUser = async (userId: number) => {
    try {
      setApprovingUserId(userId);
      await api.approveUser(userId);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleToggleApproval = async (userId: number, currentApproved: boolean) => {
    try {
      await api.updateUserApproval(userId, !currentApproved);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this account?')) return;
    try {
      await api.deleteUser(userId);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateStudentRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStudentRecord({
        enrollment_no: newRecEnroll.trim().toUpperCase(),
        name: newRecName.trim(),
        department: newRecDept,
        batch_year: newRecBatch.trim(),
        status: newRecStatus,
      });
      setShowAddRecordModal(false);
      setNewRecEnroll('');
      setNewRecName('');
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Resolve Maintenance
  const handleResolveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingMaint) return;
    try {
      await api.updateMaintenance(resolvingMaint.id, {
        resolved_status: 'resolved',
        resolution_notes: resolveNotes,
        cost: resolveCost,
      });
      setResolvingMaint(null);
      setResolveNotes('');
      setResolveCost(0);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Campus Administration & Analytics Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Master inventory management, real-time Recharts analytics, lab configurations, and role control.
          </p>
        </div>

        {/* Tab Buttons - Pill Container */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3, color: 'text-sky-500' },
            { id: 'equipment', label: 'Master Inventory', icon: Layers, color: 'text-emerald-500' },
            { id: 'labs', label: 'Labs Directory', icon: Building, color: 'text-purple-500' },
            {
              id: 'users',
              label: 'Users & Approvals',
              icon: Users,
              color: 'text-amber-500',
              badge: users.filter((u) => !u.is_approved).length,
            },
            { id: 'maintenance', label: 'Maintenance Logs', icon: Wrench, color: 'text-rose-500' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:scale-125 group-hover:-translate-y-0.5 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. ANALYTICS DASHBOARD TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {loadingAnalytics || !analytics ? (
            <div className="text-center py-12 text-slate-400">Loading live analytics...</div>
          ) : (
            <>
              {/* Analytics Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="group p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-sky-300 dark:hover:border-sky-500/40 transition duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Total Hardware Units</span>
                    <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400 transition-transform duration-200 ease-out group-hover:scale-125 group-hover:-translate-y-0.5" />
                  </div>
                  <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {analytics.kpis.total_equipment}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Across {analytics.kpis.total_labs} campus labs</div>
                </div>

                <div className="group p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-cyan-300 dark:hover:border-cyan-500/40 transition duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Equipment Utilization</span>
                    <Percent className="w-4 h-4 text-cyan-600 dark:text-cyan-400 transition-transform duration-200 ease-out group-hover:scale-125 group-hover:-translate-y-0.5" />
                  </div>
                  <div className="mt-3 text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">
                    {analytics.kpis.utilization_rate}%
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {analytics.kpis.active_bookings} active reservations
                  </div>
                </div>

                <div className="group p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-rose-300 dark:hover:border-rose-500/40 transition duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Overdue Return Rate</span>
                    <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400 transition-transform duration-200 ease-out group-hover:scale-125 group-hover:-translate-y-0.5" />
                  </div>
                  <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                    {analytics.kpis.overdue_rate}%
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {analytics.kpis.overdue_count} overdue instances
                  </div>
                </div>

                <div className="group p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] hover:border-amber-300 dark:hover:border-amber-500/40 transition duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Pending Requisitions</span>
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform duration-200 ease-out group-hover:scale-125 group-hover:-translate-y-0.5" />
                  </div>
                  <div className="mt-3 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                    {analytics.kpis.pending_requisitions}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Awaiting lab assistant action</div>
                </div>
              </div>

              {/* Recharts Row 1: Most Booked Equipment & Peak Booking Hours */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Booked Equipment Bar Chart */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Most Booked Hardware Resources</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Usage frequency breakdown of top academic equipment</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.most_booked} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
                        <XAxis
                          dataKey="equipment_name"
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          interval={0}
                          tickFormatter={(val) => val.split(' ')[0] + ' ' + (val.split(' ')[1] || '')}
                        />
                        <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', boxShadow: '0 10px 25px -3px rgba(15,23,42,0.08)', color: '#0f172a', fontSize: '12px' }}
                        />
                        <Bar dataKey="booking_count" name="Total Bookings" fill="#0284c7" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Peak Hours Heatmap / Area Chart */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Peak Lab Booking Hours Distribution</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Hourly reservation volume from 08:00 to 20:00</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.peak_hours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
                        <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', boxShadow: '0 10px 25px -3px rgba(15,23,42,0.08)', color: '#0f172a', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="count" name="Reservations" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#hourGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recharts Row 2: Overdue Rate Trends & Category Utilization Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overdue Rate Trends */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Overdue Rate & Return Compliance Trend</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Weekly comparison between on-time and overdue returns</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.overdue_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
                        <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', boxShadow: '0 10px 25px -3px rgba(15,23,42,0.08)', color: '#0f172a', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="returned_on_time" name="On-Time Returns" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="overdue" name="Overdue Incidents" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Utilization Bars */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hardware Category Utilization Rates</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Current active workload percentage by hardware segment</p>
                  </div>
                  <div className="space-y-4 pt-2">
                    {analytics.category_utilization.map((cat) => (
                      <div key={cat.category} className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{cat.category}</span>
                          <span className="font-mono text-sky-700 dark:text-cyan-400 font-bold">
                            {cat.utilization}% ({cat.in_use}/{cat.total} units)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(cat.utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. MASTER EQUIPMENT INVENTORY TAB */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Master Equipment Registry</h2>
            <button
              onClick={() => setShowAddEquipment(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Equipment</span>
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3.5">ID / Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Lab Location</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Serial Number</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {equipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        <div>{eq.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">#{eq.id}</span>
                      </td>
                      <td className="p-3.5">{eq.category}</td>
                      <td className="p-3.5">{eq.lab?.name || 'Lab'}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            eq.status === 'available'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : eq.status === 'booked'
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : eq.status === 'issued'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {eq.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {eq.serial_number || 'N/A'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="Delete Equipment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. LABS DIRECTORY TAB */}
      {activeTab === 'labs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Academic Labs & Workstation Facilities</h2>
            <button
              onClick={() => setShowAddLab(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Lab</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <div
                key={lab.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] flex flex-col justify-between space-y-4 hover:border-sky-300 dark:hover:border-sky-500/40 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-sky-700 bg-sky-50 border border-sky-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20">
                        {lab.department || 'Engineering'}
                      </span>
                      {lab.location && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            lab.location.includes('BVS')
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                              : 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20'
                          }`}
                        >
                          {lab.location.includes('BVS') ? 'BVS' : 'MMS'} • {lab.location.split(',')[1]?.trim() || ''}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteLab(lab.id)}
                      className="text-slate-400 hover:text-rose-500 transition"
                      title="Delete Lab"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{lab.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{lab.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{lab.location}</span>
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Cap: {lab.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. USER ROLE & REGISTRATION APPROVAL TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Header & Subtabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Campus User Directory & Access Approvals</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify student enrollment records against official academic roster, approve portal access, and manage department permissions.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUserSubTab('pending')}
                className={`group px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  userSubTab === 'pending'
                    ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500 transition-transform duration-200 ease-out group-hover:scale-125" />
                <span>Pending Approvals</span>
                {users.filter((u) => !u.is_approved).length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                    {users.filter((u) => !u.is_approved).length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setUserSubTab('all')}
                className={`group px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  userSubTab === 'all'
                    ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-500 transition-transform duration-200 ease-out group-hover:scale-125" />
                <span>All Accounts ({users.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setUserSubTab('registry')}
                className={`group px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  userSubTab === 'registry'
                    ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-500 transition-transform duration-200 ease-out group-hover:scale-125" />
                <span>Student Registry ({studentRecords.length})</span>
              </button>
            </div>
          </div>

          {/* Subtab 1: PENDING APPROVALS */}
          {userSubTab === 'pending' && (
            <div className="space-y-4">
              {users.filter((u) => !u.is_approved).length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">All Clear! No Pending Requests</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    All registered campus users have been verified and approved. When a new student registers with their enrollment number, their request will appear here for record cross-checking and approval.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {users
                    .filter((u) => !u.is_approved)
                    .map((u) => {
                      const v = u.record_verification;
                      const isMatched = v?.matched;
                      return (
                        <div
                          key={u.id}
                          className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-bold flex items-center justify-center text-sm">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</h4>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                                    Pending Approval
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200 dark:bg-indigo-500/20 dark:text-indigo-300">
                                    {u.role}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                                  <span>{u.email}</span>
                                  <span>•</span>
                                  <span className="text-sky-700 dark:text-indigo-300 font-sans font-semibold">{u.department}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                disabled={approvingUserId === u.id}
                                onClick={() => handleApproveUser(u.id)}
                                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{approvingUserId === u.id ? 'Approving...' : 'Approve Access'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-3 py-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 dark:border-rose-500/30 dark:text-rose-300 text-xs font-semibold transition"
                                title="Reject and Delete Request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Record Verification Box */}
                          <div
                            className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isMatched
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-500/30 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:border-amber-500/30 dark:text-amber-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold flex items-center gap-1">
                                  {isMatched ? (
                                    <>
                                      <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                      <span>Official Institutional Record Found</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                      <span>No Matching Record in Student Registry</span>
                                    </>
                                  )}
                                </span>
                                {isMatched && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                                    {v?.status || 'Active Enrolled'}
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                  Submitted Enrollment No:{' '}
                                  <strong className="font-mono text-sky-700 dark:text-cyan-300">{u.enrollment_no || 'None'}</strong>
                                </span>
                                {isMatched && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Registry Name: <strong className="text-slate-900 dark:text-white">{v?.official_name}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Registry Dept: <strong className="text-slate-900 dark:text-white">{v?.official_department}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Cohort: <strong className="text-slate-900 dark:text-white">{v?.batch_year}</strong>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="text-right sm:shrink-0">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">{v?.message}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Subtab 2: ALL USER ACCOUNTS */}
          {userSubTab === 'all' && (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, department, or enrollment no..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                />
              </div>

              <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Enrollment No.</th>
                      <th className="p-3.5">Registry Status</th>
                      <th className="p-3.5">Approval</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {users
                      .filter((u) => {
                        if (!userSearch) return true;
                        const s = userSearch.toLowerCase();
                        return (
                          u.name.toLowerCase().includes(s) ||
                          u.email.toLowerCase().includes(s) ||
                          (u.department && u.department.toLowerCase().includes(s)) ||
                          (u.enrollment_no && u.enrollment_no.toLowerCase().includes(s))
                        );
                      })
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-sky-50 dark:bg-indigo-600/30 border border-sky-200 dark:border-indigo-500/40 text-sky-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                              {u.name.charAt(0)}
                            </div>
                            <span>{u.name}</span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">{u.email}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-sky-50 text-sky-700 border border-sky-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 font-medium">
                              {u.department}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-sky-700 dark:text-cyan-300 text-xs font-semibold">
                            {u.enrollment_no || <span className="text-slate-400 font-sans font-normal">—</span>}
                          </td>
                          <td className="p-3.5">
                            {u.enrollment_no ? (
                              u.record_verification?.matched ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                                  <Check className="w-3 h-3" />
                                  <span>Verified Record</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Unverified</span>
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-400">Staff / Non-student</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {u.is_approved ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400">
                                Approved
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              className="py-1 px-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm"
                            >
                              <option value="student">Student</option>
                              <option value="lab_assistant">Lab Assistant</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!u.is_approved ? (
                                <button
                                  type="button"
                                  onClick={() => handleApproveUser(u.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                                  title="Approve access"
                                >
                                  Approve
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleApproval(u.id, true)}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-medium transition"
                                  title="Revoke access"
                                >
                                  Revoke
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab 3: INSTITUTIONAL STUDENT REGISTRY */}
          {userSubTab === 'registry' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative max-w-md w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={registrySearch}
                    onChange={(e) => setRegistrySearch(e.target.value)}
                    placeholder="Search registry by enrollment no., student name, or department..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddRecordModal(true)}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Registry Record</span>
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <tr>
                      <th className="p-3.5">Enrollment No.</th>
                      <th className="p-3.5">Official Student Name</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Academic Cohort</th>
                      <th className="p-3.5">Enrollment Status</th>
                      <th className="p-3.5 text-right">Platform Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {studentRecords
                      .filter((r) => {
                        if (!registrySearch) return true;
                        const s = registrySearch.toLowerCase();
                        return (
                          r.enrollment_no.toLowerCase().includes(s) ||
                          r.name.toLowerCase().includes(s) ||
                          r.department.toLowerCase().includes(s)
                        );
                      })
                      .map((r) => {
                        const registeredUser = users.find(
                          (u) =>
                            u.enrollment_no &&
                            u.enrollment_no.trim().toUpperCase() === r.enrollment_no.trim().toUpperCase()
                        );
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-mono font-bold text-sky-700 dark:text-cyan-300">{r.enrollment_no}</td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">{r.name}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[11px] bg-sky-50 text-sky-700 border border-sky-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 font-medium">
                                {r.department}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{r.batch_year}</td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400">
                                {r.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              {registeredUser ? (
                                registeredUser.is_approved ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                                    ✓ Active User
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveUser(registeredUser.id)}
                                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[10px] font-bold uppercase transition"
                                  >
                                    Approve Registration
                                  </button>
                                )
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Not Registered Yet</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MAINTENANCE OVERVIEW TAB */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Equipment Maintenance & Damage Log</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Resolve flagged damage tickets and restore units to available pool.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5">ID / Equipment</th>
                  <th className="p-3.5">Issue Description</th>
                  <th className="p-3.5">Reported By</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Cost ($)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {maintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div>{m.equipment?.name || `Equipment #${m.equipment_id}`}</div>
                      <span className="text-[10px] text-slate-400 font-mono">Log #{m.id}</span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs">{m.issue_description}</td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">{m.reported_by}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          m.resolved_status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse'
                        }`}
                      >
                        {m.resolved_status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">${m.cost || 0}</td>
                    <td className="p-3.5 text-right">
                      {m.resolved_status !== 'resolved' ? (
                        <button
                          onClick={() => {
                            setResolvingMaint(m);
                            setResolveCost(m.cost || 50);
                            setResolveNotes('Diagnostics performed, parts repaired/replaced. Recommissioned to inventory.');
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white rounded-full text-xs font-semibold shadow-sm transition"
                        >
                          Resolve Ticket
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Hardware Resource</h3>
              <button onClick={() => setShowAddEquipment(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  value={newEqName}
                  onChange={(e) => setNewEqName(e.target.value)}
                  placeholder="e.g. Jetson Orin Nano Developer Kit"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={newEqCategory}
                  onChange={(e) => setNewEqCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                >
                  {EQUIPMENT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Lab</label>
                <select
                  value={newEqLabId}
                  onChange={(e) => setNewEqLabId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                >
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={newEqSerial}
                  onChange={(e) => setNewEqSerial(e.target.value)}
                  placeholder="e.g. ROB-JET-402"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hardware Specs</label>
                <input
                  type="text"
                  value={newEqSpecs}
                  onChange={(e) => setNewEqSpecs(e.target.value)}
                  placeholder="e.g. 40 TOPS AI compute, 8GB memory"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newEqDescription}
                  onChange={(e) => setNewEqDescription(e.target.value)}
                  placeholder="Overview of capabilities and use cases..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEquipment(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lab Modal */}
      {showAddLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Create Campus Lab</h3>
              <button onClick={() => setShowAddLab(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLab} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Lab Facility Name</label>
                <input
                  type="text"
                  required
                  value={newLabName}
                  onChange={(e) => setNewLabName(e.target.value)}
                  placeholder="e.g. Advanced Photonics & Optics Lab"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Building Location</label>
                <input
                  type="text"
                  required
                  value={newLabLocation}
                  onChange={(e) => setNewLabLocation(e.target.value)}
                  placeholder="e.g. BVS Block, 3rd Floor or MMS Block, 2nd Floor"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Workstation Capacity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newLabCapacity}
                  onChange={(e) => setNewLabCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={newLabDepartment}
                  onChange={(e) => setNewLabDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                >
                  {ACADEMIC_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLab(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
                >
                  Create Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Maintenance Modal */}
      {resolvingMaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                Resolve Maintenance Ticket #{resolvingMaint.id}
              </h3>
              <button onClick={() => setResolvingMaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              <p><strong>Equipment:</strong> {resolvingMaint.equipment?.name}</p>
              <p className="mt-1"><strong>Issue:</strong> {resolvingMaint.issue_description}</p>
            </div>

            <form onSubmit={handleResolveMaintenance} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  required
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Final Repair Cost ($)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={resolveCost}
                  onChange={(e) => setResolveCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingMaint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
                >
                  Mark Resolved & Available
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Institutional Student Record Modal */}
      {showAddRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Student to Institutional Registry</h3>
              <button onClick={() => setShowAddRecordModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudentRecord} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Enrollment Number</label>
                <input
                  type="text"
                  required
                  value={newRecEnroll}
                  onChange={(e) => setNewRecEnroll(e.target.value.toUpperCase())}
                  placeholder="e.g. 0101CS241001"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newRecName}
                  onChange={(e) => setNewRecName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Department</label>
                <select
                  value={newRecDept}
                  onChange={(e) => setNewRecDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                >
                  {ACADEMIC_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Cohort / Batch</label>
                <input
                  type="text"
                  value={newRecBatch}
                  onChange={(e) => setNewRecBatch(e.target.value)}
                  placeholder="e.g. 2024-2028"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Enrollment Status</label>
                <select
                  value={newRecStatus}
                  onChange={(e) => setNewRecStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Active Enrolled">Active Enrolled</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
                >
                  Save to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
