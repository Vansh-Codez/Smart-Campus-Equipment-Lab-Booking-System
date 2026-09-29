import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ACADEMIC_DEPARTMENTS } from '../types';
import {
  Cpu,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  FlaskConical,
  Eye,
  EyeOff,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register, switchDemoRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState<string>(ACADEMIC_DEPARTMENTS[0]);
  const [role, setRole] = useState('student');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingApprovalInfo, setPendingApprovalInfo] = useState<{
    name: string;
    email: string;
    department: string;
    enrollmentNo?: string;
    message?: string;
  } | null>(null);

  const peekTimeoutRef = useRef<any>(null);

  const handlePeekPassword = () => {
    if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
    if (showPassword) {
      setShowPassword(false);
    } else {
      setShowPassword(true);
      peekTimeoutRef.current = setTimeout(() => {
        setShowPassword(false);
      }, 1500);
    }
  };

  useEffect(() => {
    return () => {
      if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
    };
  }, []);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        if (role === 'student' && !enrollmentNo.trim()) {
          setError('Student Enrollment Number is required for registration.');
          return;
        }

        const res = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          department,
          role,
          enrollment_no: role === 'student' ? enrollmentNo.trim().toUpperCase() : undefined,
        });

        if (res && res.is_approved === false) {
          setPendingApprovalInfo({
            name: name.trim(),
            email: email.trim(),
            department,
            enrollmentNo: role === 'student' ? enrollmentNo.trim().toUpperCase() : undefined,
            message: res.message,
          });
          return;
        }
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  const handleQuickLogin = async (demoRole: 'student' | 'lab_assistant' | 'admin') => {
    setError(null);
    setPendingApprovalInfo(null);
    try {
      await switchDemoRole(demoRole);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetToLogin = () => {
    setPendingApprovalInfo(null);
    setIsRegister(false);
    setError(null);
  };

  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl dark:bg-cyan-400/10" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute left-1/2 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)] lg:gap-14">
        {/* Product introduction and demo access */}
        <section className="order-2 flex flex-col justify-center lg:order-1">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/25 ring-4 ring-sky-500/10">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-sky-700 dark:text-cyan-300">CampusOS</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                Infrastructure online
              </div>
            </div>
          </div>

          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/80 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700 shadow-sm shadow-sky-900/5 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Academic IoT, GPU & Lab Infrastructure
          </div>

          <h1 className="max-w-2xl text-4xl font-black leading-[1.03] tracking-[-0.04em] text-slate-950 dark:text-white sm:text-5xl lg:text-[3.65rem]">
            Smart Campus
            <span className="mt-2 block bg-gradient-to-r from-sky-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-emerald-300">
              Equipment & Lab Booking
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            One calm, intelligent workspace for conflict-free reservations, verified student access, and every piece of equipment your next breakthrough needs.
          </p>

          <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 border-y border-slate-200/80 py-4 dark:border-slate-800/80 sm:gap-5">
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white">24/7</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">Live access</div>
            </div>
            <div className="border-l border-slate-200/80 pl-3 dark:border-slate-800/80 sm:pl-5">
              <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white">0-conflict</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">Scheduling</div>
            </div>
            <div className="border-l border-slate-200/80 pl-3 dark:border-slate-800/80 sm:pl-5">
              <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white">24h</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">Return nudges</div>
            </div>
          </div>

          {/* Quick Demo Logins Card */}
          <div className="mt-7 max-w-xl rounded-[1.65rem] border border-slate-200/90 bg-white/80 p-4 shadow-[0_18px_45px_-25px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/70 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Instant 1-Click Persona Access</h2>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Explore the portal with a ready-made workspace.</p>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                Demo mode
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('student')}
                className="group rounded-2xl border border-sky-200/80 bg-sky-50/60 p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100/80 hover:shadow-md dark:border-indigo-500/20 dark:bg-indigo-950/25 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-900/30"
              >
                <div className="mb-2 flex items-center justify-between">
                  <GraduationCap className="h-4 w-4 text-sky-600 dark:text-indigo-300" />
                  <ArrowRight className="h-3.5 w-3.5 text-sky-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-indigo-300" />
                </div>
                <div className="text-xs font-bold text-sky-900 dark:text-indigo-100">Student</div>
                <div className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">CSE-AIML | 0101CS211001</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('lab_assistant')}
                className="group rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100/80 hover:shadow-md dark:border-emerald-500/20 dark:bg-emerald-950/25 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-900/30"
              >
                <div className="mb-2 flex items-center justify-between">
                  <FlaskConical className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-100">Lab Assistant</div>
                <div className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">ECE Faculty/Staff</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="group rounded-2xl border border-purple-200/80 bg-purple-50/60 p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-100/80 hover:shadow-md dark:border-purple-500/20 dark:bg-purple-950/25 dark:hover:border-purple-400/40 dark:hover:bg-purple-900/30"
              >
                <div className="mb-2 flex items-center justify-between">
                  <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  <ArrowRight className="h-3.5 w-3.5 text-purple-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <div className="text-xs font-bold text-purple-900 dark:text-purple-100">Admin</div>
                <div className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Dean / CSE-1</div>
              </button>
            </div>
          </div>
        </section>

        {/* Authentication panel */}
        <section className="order-1 lg:order-2">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/90 shadow-[0_28px_80px_-35px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-800/90 dark:bg-slate-900/85">
            <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400" />
            <div className="p-5 sm:p-8">
              {pendingApprovalInfo ? (
                /* Pending Approval Confirmation View */
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-cyan-300">Account request</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your profile is in the verification queue.</div>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                      <Clock className="h-5 w-5 animate-pulse" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Registration Submitted</h2>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Pending Administrator Verification
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Your request has been queued for verification. The campus administrator will verify your enrollment against official institutional records before granting access.
                  </p>

                  <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/70">
                    <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
                      <span>Applicant</span>
                      <span className="text-right font-semibold text-slate-900 dark:text-white">{pendingApprovalInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
                      <span>Email</span>
                      <span className="max-w-[65%] truncate text-right font-mono font-medium text-slate-800 dark:text-slate-200">{pendingApprovalInfo.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
                      <span>Department</span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-right font-semibold text-sky-700 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-300">{pendingApprovalInfo.department}</span>
                    </div>
                    {pendingApprovalInfo.enrollmentNo && (
                      <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
                        <span>Enrollment No.</span>
                        <span className="font-mono font-bold tracking-wider text-sky-700 dark:text-cyan-300">{pendingApprovalInfo.enrollmentNo}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5 rounded-2xl border border-sky-200 bg-sky-50/80 p-3.5 text-xs leading-5 text-sky-800 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-cyan-400" />
                    <span>
                      Tip: You can switch to the <strong>Admin persona</strong> from the 1-click personas on the left to review, verify records, and approve this registration immediately!
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={resetToLogin}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Return to Sign In
                  </button>
                </div>
              ) : (
                /* Regular Login / Register Form */
                <>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-cyan-300">
                        <Lock className="h-3 w-3" />
                        Secure campus access
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                        {isRegister ? 'Create Academic Account' : 'Sign In to Campus Portal'}
                      </h2>
                    </div>
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 sm:flex">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-1 dark:border-slate-800 dark:bg-slate-950/50">
                    <span className="px-3 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {isRegister ? 'Join your academic workspace' : 'Welcome back, researcher'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setError(null);
                      }}
                      className="rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-sky-700 shadow-sm transition hover:text-sky-800 dark:bg-slate-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                    >
                      {isRegister ? 'Sign in' : 'Create account'}
                    </button>
                  </div>

                  {error && (
                    <div className={`mb-5 flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs leading-5 ${
                      error.toLowerCase().includes('pending')
                        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                        : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                    }`}>
                      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${error.toLowerCase().includes('pending') ? 'text-amber-500' : 'text-rose-500'}`} />
                      <div>
                        <div className="mb-0.5 font-bold">
                          {error.toLowerCase().includes('pending') ? 'Verification Pending' : 'Authentication Error'}
                        </div>
                        <div>{error}</div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                      <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Full Name</label>
                            <div className="relative">
                              <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Maya Lin"
                                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-cyan-400 dark:focus:bg-slate-950 dark:focus:ring-cyan-400/10"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Academic Department</label>
                            <div className="relative">
                              <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                              <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-cyan-400 dark:focus:bg-slate-950 dark:focus:ring-cyan-400/10"
                              >
                                {ACADEMIC_DEPARTMENTS.map((dept) => (
                                  <option key={dept} value={dept}>
                                    {dept}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Requested Role</label>
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-cyan-400 dark:focus:bg-slate-950 dark:focus:ring-cyan-400/10"
                          >
                            <option value="student">Student / Researcher</option>
                            <option value="lab_assistant">Lab Assistant / Faculty</option>
                            <option value="admin">System Administrator</option>
                          </select>
                        </div>

                        {role === 'student' && (
                          <div>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                Student Enrollment No. <span className="text-rose-500">*</span>
                              </label>
                              <span className="text-[10px] font-semibold text-sky-600 dark:text-cyan-400">Verified by Admin</span>
                            </div>
                            <div className="relative">
                              <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                required
                                value={enrollmentNo}
                                onChange={(e) => setEnrollmentNo(e.target.value.toUpperCase())}
                                placeholder="e.g. 0101CS231015"
                                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pl-10 pr-3 font-mono text-xs uppercase tracking-wider text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-cyan-400 dark:focus:bg-slate-950 dark:focus:ring-cyan-400/10"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Campus Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="student@campus.edu"
                          className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-cyan-400 dark:focus:bg-slate-950 dark:focus:ring-cyan-400/10"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Password</label>
                        {showPassword && (
                          <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-sky-600 dark:text-cyan-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                            Peeking (auto-hides)
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-3 pl-10 pr-11 font-mono text-sm tracking-wider text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-cyan-400 dark:focus:bg-slate-950 dark:focus:ring-cyan-400/10"
                        />
                        <button
                          type="button"
                          onClick={handlePeekPassword}
                          onMouseDown={() => {
                            if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
                            setShowPassword(true);
                          }}
                          onMouseUp={() => {
                            if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
                            peekTimeoutRef.current = setTimeout(() => setShowPassword(false), 1200);
                          }}
                          title={showPassword ? 'Hide password' : 'Peek password for a split second'}
                          aria-label={showPassword ? 'Hide password' : 'Show password briefly'}
                          className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-sky-600 dark:hover:bg-slate-800/80 dark:hover:text-cyan-300"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-sky-600 dark:text-cyan-400" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      aria-busy={loading}
                      className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-sky-500 hover:via-indigo-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-indigo-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      <span>{isRegister ? 'Submit Registration Request' : 'Authenticate & Continue'}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </form>

                  <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    Encrypted access · verified campus identity
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
