import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type LoginResponse = {
  message?: string;
  redirectTo?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.redirectTo) {
        throw new Error(data.message || 'Unable to sign in. Please check your details.');
      }

      navigate(data.redirectTo);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container-shell flex items-center justify-center py-20">
      <div className="card-surface w-full max-w-md p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">MMA portal access</p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Login</h1>
        <p className="mt-3 text-slate-600">Sign in with the account issued by Manish Mishra Academy.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="your.email@example.com" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Enter password" />
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={isSubmitting} type="submit" className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
