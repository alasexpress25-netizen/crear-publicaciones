import React, { useState } from 'react';
import { Lock, Mail, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithPassword } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';

interface LoginScreenProps {
  onSuccess: (session: Session) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Ingresá tu email y contraseña.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const { session, error: signInError } = await signInWithPassword(email, password);
    setIsSubmitting(false);
    if (signInError || !session) {
      setError(
        signInError && signInError.toLowerCase().includes('invalid login credentials')
          ? 'Email o contraseña incorrectos.'
          : signInError || 'No se pudo iniciar sesión.'
      );
      return;
    }
    onSuccess(session);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b0f1a] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111827] p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600/20 text-rose-500">
            <Lock size={22} />
          </div>
          <h1 className="text-lg font-semibold text-white">La Visual MK · Crear</h1>
          <p className="mt-1 text-sm text-white/50">Iniciá sesión con tu cuenta de agencia para acceder a los clientes.</p>
        </div>

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/60">Email</label>
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <Mail size={16} className="text-white/40" />
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/60">Contraseña</label>
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <Lock size={16} className="text-white/40" />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};
