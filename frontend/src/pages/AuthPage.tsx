import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Building,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';

const POPULAR_ORGANIZATIONS = [
  'NASA Glenn Research Center (GRC)',
  'NASA Ames Research Center',
  'ESA ESTEC',
  'JAXA Tsukuba Space Center',
  'MIT AeroAstro',
  'Stanford Aerospace',
  'German Aerospace Center (DLR)',
];

const RESEARCH_ROLES = [
  'Microgravity Combustion Researcher',
  'Smoke Aerosol & Detection Specialist',
  'Spacecraft Fire Safety Officer',
  'ECLSS Life Support Systems Engineer',
  'Materials Flammability Engineer',
  'Space Exploration Mission Planner',
  'Academic Faculty / Graduate Fellow',
];

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'login' ? 'login' : 'signup';
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const navigate = useNavigate();
  const { user, signUp, signIn, quickDemoLogin, loading } = useAuth();

  // Sign Up Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState(POPULAR_ORGANIZATIONS[0]);
  const [customOrg, setCustomOrg] = useState('');
  const [role, setRole] = useState(RESEARCH_ROLES[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordStrong = hasMinLength && hasNumber && hasLetter;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full scientific or researcher name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid academic, institutional, or personal email address.');
      return;
    }
    if (!isPasswordStrong) {
      setError('Password must be at least 8 characters and contain both letters and digits.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirmation do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept the scientific data ethics and source attribution agreement.');
      return;
    }

    const orgToUse = organization === 'Other' ? customOrg.trim() || 'Independent Researcher' : organization;

    const res = await signUp({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      organization: orgToUse,
      role,
    });

    if (res.success) {
      setSuccessMessage(`Account successfully registered! Welcome to the FIRELINE Scientific Engine, ${name}.`);
      setTimeout(() => {
        navigate('/');
      }, 1600);
    } else {
      setError(res.error || 'Failed to complete registration.');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    const res = await signIn({
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword,
    });

    if (res.success) {
      setSuccessMessage('Authentication verified. Loading your mission dashboard...');
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        badge="Researcher Access & Session Portal"
        badgeColor="blue"
        title="FIRELINE Researcher Registry"
        subtitle="Create an accredited aerospace research profile to access NASA PSI microgravity combustion models, save analytical comparisons, and synthesize grounded research reports."
      />

      {/* Hero Card Container */}
      <div className="bg-white dark:bg-[#0B1D36] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#07172B]">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              mode === 'signup'
                ? 'border-[#0B3D91] text-[#0B3D91] dark:border-[#38BDF8] dark:text-[#38BDF8] bg-white dark:bg-[#0B1D36]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-[#9FB1C7] dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Create Account (Sign Up)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              mode === 'login'
                ? 'border-[#0B3D91] text-[#0B3D91] dark:border-[#38BDF8] dark:text-[#38BDF8] bg-white dark:bg-[#0B1D36]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-[#9FB1C7] dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Existing Researcher (Sign In)</span>
          </button>
        </div>

        {/* Current Session Banner if already signed in */}
        {user && (
          <div className="p-4 bg-teal-500/10 border-b border-teal-500/20 text-teal-800 dark:text-[#24B8A0] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Currently active profile: <strong>{user.name}</strong> ({user.organization} • {user.role})
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 font-semibold hover:underline shrink-0"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Feedback alerts */}
        {error && (
          <div className="m-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Validation Notice</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="m-6 p-4 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-800 dark:text-teal-200 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-xs mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Form Body with Live Holographic NASA Researcher Badge */}
        <div className="p-6 sm:p-8">
          {mode === 'signup' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Registration Form */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#9FB1C7]">
                        Full Name & Title <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Dr. Sarah Mitchell"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10243D] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] text-sm"
                        />
                      </div>
                    </div>

                    {/* Institutional Email */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#9FB1C7]">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        {email.endsWith('.gov') || email.endsWith('.edu') || email.endsWith('.org') ? (
                          <span className="text-[10px] font-mono text-teal-600 dark:text-[#24B8A0] font-semibold">
                            Accredited Domain
                          </span>
                        ) : null}
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="sarah.mitchell@nasa.gov"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10243D] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] text-sm"
                        />
                      </div>
                    </div>

                    {/* Organization Selection */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#9FB1C7]">
                        Research Organization / Center <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10243D] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8] text-sm"
                        >
                          {POPULAR_ORGANIZATIONS.map((org) => (
                            <option key={org} value={org}>
                              {org}
                            </option>
                          ))}
                          <option value="Other">Other (Specify Below)</option>
                        </select>
                      </div>
                      {organization === 'Other' && (
                        <input
                          type="text"
                          placeholder="Enter research facility or university name"
                          value={customOrg}
                          onChange={(e) => setCustomOrg(e.target.value)}
                          className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10243D] text-slate-900 dark:text-white text-sm"
                        />
                      )}
                    </div>

                    {/* Research Discipline / Role */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#9FB1C7]">
                        Operational Role / Research Discipline <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10243D] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8] text-sm"
                        >
                          {RESEARCH_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#9FB1C7]">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 chars"
                          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10243D] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#9FB1C7]">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        {confirmPassword.length > 0 && (
                          <span
                            className={`text-[10px] font-mono font-semibold ${
                              passwordsMatch ? 'text-teal-600 dark:text-[#24B8A0]' : 'text-rose-500'
                            }`}
                          >
                            {passwordsMatch ? 'Match' : 'Mismatch'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10243D] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Checklist */}
                  <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        hasMinLength ? 'text-teal-600 dark:text-[#24B8A0]' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> 8+ Chars
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        hasLetter ? 'text-teal-600 dark:text-[#24B8A0]' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Letter
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        hasNumber ? 'text-teal-600 dark:text-[#24B8A0]' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Number
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        hasSpecial ? 'text-teal-600 dark:text-[#24B8A0]' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Symbol
                    </span>
                  </div>

                  {/* Data Policy Agreement */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-1 rounded border-slate-300 dark:border-slate-700 text-[#0B3D91] focus:ring-[#38BDF8]"
                      />
                      <div className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
                        <strong className="text-slate-800 dark:text-white">Scientific Attribution & Open Data Agreement:</strong>{' '}
                        I agree to abide by NASA Physical Sciences Informatics open science guidelines, preserve source
                        provenance (PSI IDs and NTRS citations) in derived research publications, and not use microgravity
                        extrapolations for flight certification without peer-reviewed validation.
                      </div>
                    </label>
                  </div>

                  {/* Submit Button & Fast Login */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#0B3D91] hover:bg-[#092B66] text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{loading ? 'Creating Credentials...' : 'Complete Registration & Sign In'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={quickDemoLogin}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-teal-500/30 text-teal-700 dark:text-[#24B8A0] bg-teal-500/10 hover:bg-teal-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>One-Click Evaluator Sign-In</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Live Interactive Holographic NASA Badge */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
                <div className="text-center mb-3">
                  <div className="text-xs font-mono text-[#38BDF8] font-semibold tracking-wider">LIVE CREDENTIAL PREVIEW</div>
                  <div className="text-[11px] text-slate-500 dark:text-[#9FB1C7]">NASA PSI Digital Mission Pass</div>
                </div>

                {/* NASA Researcher Credential Card */}
                <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#0B1D36] via-[#07172B] to-[#040C18] border-2 border-[#38BDF8]/40 p-6 shadow-2xl text-[#F4F7FC] hud-corner">
                  {/* Lanyard punch hole */}
                  <div className="w-14 h-2.5 bg-slate-800 rounded-full mx-auto mb-4 border border-slate-600/50" />

                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0B3D91] border border-[#38BDF8] flex items-center justify-center font-bold text-xs text-white">
                        Ψ
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-mono tracking-widest text-[#38BDF8] font-bold">NASA PSI ACCESS</div>
                        <div className="text-[8px] font-mono text-slate-400">MISSION CREDENTIAL</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-[#24B8A0] border border-emerald-500/40 font-semibold">
                        ACTIVE PASS
                      </span>
                    </div>
                  </div>

                  {/* Photo / Avatar & Identity Details */}
                  <div className="mt-5 flex flex-col items-center text-center">
                    <div className="relative w-20 h-20 rounded-full bg-[#0B3D91] border-2 border-[#38BDF8] p-1 shadow-inner flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-[#10243D] flex items-center justify-center text-xl font-bold text-[#38BDF8] tracking-wider">
                        {name ? name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() : 'DR'}
                      </div>
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#24B8A0] border-2 border-[#0B1D36] hud-beacon" />
                    </div>

                    <div className="mt-3 font-bold text-base text-white tracking-wide">
                      {name || 'Dr. Alex Vance'}
                    </div>
                    <div className="text-xs font-mono text-[#38BDF8] mt-0.5">
                      {role || 'Combustion Researcher'}
                    </div>
                    <div className="text-[11px] text-[#9FB1C7] mt-1 max-w-[240px]">
                      {organization === 'Other' ? customOrg || 'Aerospace Laboratory' : organization}
                    </div>
                  </div>

                  {/* Security Clearance Details */}
                  <div className="mt-6 pt-4 border-t border-slate-700/60 space-y-2 text-[10px] font-mono text-left">
                    <div className="flex justify-between text-slate-400">
                      <span>ACCESS REGIME:</span>
                      <span className="text-white font-semibold">MICROGRAVITY FLIGHT DATA</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>OPERATIONAL CLEARANCE:</span>
                      <span className="text-[#24B8A0] font-semibold">LEVEL 2 - SCIENTIFIC</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>SECURITY TOKEN:</span>
                      <span className="text-[#38BDF8]">PSI-{(name.length * 37 + 1042) % 9999}</span>
                    </div>
                  </div>

                  {/* Barcode & Security Strip */}
                  <div className="mt-5 pt-3 border-t border-dashed border-slate-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 h-6">
                      {[12, 24, 8, 16, 28, 14, 20, 8, 26, 12, 18, 22, 10, 24].map((h, i) => (
                        <div key={i} className="w-1 bg-[#38BDF8]/60 rounded-xs" style={{ height: `${h}px` }} />
                      ))}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      ISS-EXP-2026
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= SIGN IN FORM ================= */
            <form onSubmit={handleSignIn} className="space-y-6 max-w-lg mx-auto">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#9FB1C7]">
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="elena.vance@nasa.gov"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10243D] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#9FB1C7]">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('elena.vance@nasa.gov');
                      setLoginPassword('DemoPassword2026!');
                    }}
                    className="text-[11px] text-[#38BDF8] hover:underline"
                  >
                    Fill sample credentials
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10243D] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#0B3D91] hover:bg-[#092B66] text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In to FIRELINE'}</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={quickDemoLogin}
                    className="text-xs font-semibold text-teal-600 dark:text-[#24B8A0] hover:underline inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Or continue as Dr. Elena Vance (Lead GRC Investigator)</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer info box */}
        <div className="p-4 bg-slate-50 dark:bg-[#07172B] border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-[#9FB1C7] flex items-center justify-center gap-2">
          <FileCheck className="w-4 h-4 text-[#38BDF8]" />
          <span>NASA Physical Sciences Informatics • Spacecraft Fire Safety Research Decision Support</span>
        </div>
      </div>
    </div>
  );
};
