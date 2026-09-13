import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container-shell flex min-h-[60vh] flex-col items-center justify-center text-center py-16">
      <div className="text-6xl font-black text-sky-600">404</div>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 max-w-lg text-slate-600">The page you are looking for does not exist or may have moved.</p>
      <Link to="/" className="primary-button mt-8">Go to homepage</Link>
    </div>
  );
}
