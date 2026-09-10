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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-transparent">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side Presentation */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 dark:bg-indigo-500/10 border border-sky-200 dark:border-indigo-500/30 text-sky-700 dark:text-indigo-400 text-xs font-semibold">
            <Cpu className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <span>Academic IoT, GPU & Lab Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Smart Campus <br />
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 dark:from-indigo-400 dark:via-cyan-300 dark:to-emerald-400 bg-clip-text text-transparent">
              Equipment & Lab Booking
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Eliminating paper registers with real-time conflict-free slot scheduling, automated 24-hour return reminders, and verified student access across departments.
          </p>

          {/* Quick Demo Logins Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <span>Instant 1-Click Persona Access:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('student')}
                className="p-3.5 rounded-2xl border border-sky-200/80 bg-sky-50/50 hover:bg-sky-100/60 dark:border-indigo-500/20 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-left transition group shadow-sm"
              >
                <div className="flex items-center gap-2 text-sky-700 dark:text-indigo-400 font-semibold text-xs mb-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>Student</span>
                </div>
                <div className="text-[11px] text-slate-800 dark:text-slate-300 font-bold">Alex Rivera</div>
                <div className="text-[10px] text-slate-500">CSE-AIML | 0101CS211001</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('lab_assistant')}
                className="p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100/60 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-left transition group shadow-sm"
              >
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs mb-1">
                  <FlaskConical className="w-4 h-4" />
                  <span>Lab Assistant</span>
                </div>
                <div className="text-[11px] text-slate-800 dark:text-slate-300 font-bold">Dr. Sarah Chen</div>
                <div className="text-[10px] text-slate-500">ECE Faculty/Staff</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-3.5 rounded-2xl border border-purple-200/80 bg-purple-50/50 hover:bg-purple-100/60 dark:border-purple-500/20 dark:bg-purple-950/20 dark:hover:bg-purple-900/30 text-left transition group shadow-sm"
              >
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-semibold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </div>
                <div className="text-[11px] text-slate-800 dark:text-slate-300 font-bold">Prof. Vance</div>
                <div className="text-[10px] text-slate-500">Dean / CSE-1</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Card */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-[0_4px_25px_-2px_rgba(15,23,42,0.06)]">
          {pendingApprovalInfo ? (
            /* Pending Approval Confirmation View */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Registration Submitted</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                  <span>Pending Administrator Verification</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                Your request has been queued for verification. The campus administrator will verify your enrollment against official institutional records before granting access.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Applicant:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{pendingApprovalInfo.name}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Email:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">{pendingApprovalInfo.email}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Department:</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold">
                    {pendingApprovalInfo.department}
                  </span>
                </div>
                {pendingApprovalInfo.enrollmentNo && (
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>Enrollment No:</span>
                    <span className="font-mono font-bold text-sky-700 dark:text-cyan-300 tracking-wider">
                      {pendingApprovalInfo.enrollmentNo}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-indigo-500/10 border border-sky-200 dark:border-indigo-500/20 text-[11px] text-sky-800 dark:text-indigo-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-sky-600 dark:text-cyan-400 mt-0.5" />
                <span>
                  Tip: You can switch to the <strong>Admin persona</strong> from the 1-click personas on the left to review, verify records, and approve this registration immediately!
                </span>
              </div>

              <button
                type="button"
                onClick={resetToLogin}
                className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            /* Regular Login / Register Form */
            <>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isRegister ? 'Create Academic Account' : 'Sign In to Campus Portal'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                  }}
                  className="text-xs text-sky-600 dark:text-indigo-400 hover:text-sky-700 dark:hover:text-indigo-300 font-semibold transition"
                >
                  {isRegister ? 'Have an account? Sign in' : 'Need an account? Sign up'}
                </button>
              </div>

              {error && (
                <div className={`mb-4 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  error.toLowerCase().includes('pending')
                    ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300'
                    : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <div className="font-semibold mb-0.5">
                      {error.toLowerCase().includes('pending') ? 'Verification Pending' : 'Authentication Error'}
                    </div>
                    <div>{error}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Maya Lin"
                          className="w-full pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Department</label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                        >
                          {ACADEMIC_DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Requested Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                      >
                        <option value="student">Student / Researcher</option>
                        <option value="lab_assistant">Lab Assistant / Faculty</option>
                        <option value="admin">System Administrator</option>
                      </select>
                    </div>

                    {role === 'student' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Student Enrollment No. <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] text-sky-600 dark:text-cyan-400 font-semibold">Verified by Admin</span>
                        </div>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            value={enrollmentNo}
                            onChange={(e) => setEnrollmentNo(e.target.value.toUpperCase())}
                            placeholder="e.g. 0101CS231015"
                            className="w-full pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono tracking-wider text-xs uppercase shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Campus Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@campus.edu"
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                    {showPassword && (
                      <span className="text-[10px] text-sky-600 dark:text-cyan-400 font-mono flex items-center gap-1 animate-pulse font-semibold">
                        <span>Peeking (auto-hides)</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono tracking-wider shadow-sm"
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
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-5 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-sm shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition duration-200"
                >
                  <span>{isRegister ? 'Submit Registration Request' : 'Authenticate & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
