import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Courses', to: '/courses' },
  { label: 'Facilities', to: '/facilities' },
  { label: 'Timetable', to: '/timetable' },
  { label: 'Study Environment', to: '/study-environment' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
  { label: 'Login', to: '/login' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="container-shell flex items-center justify-between py-4">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 font-black text-lg text-white shadow-md shadow-sky-200">M</div>
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">MMA</div>
              <div className="text-xs text-slate-500">Academy</div>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition ${isActive ? 'text-sky-700' : 'text-slate-600 hover:text-sky-700'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:block">
            <NavLink to="/contact" className="primary-button">
              Enquire Now
            </NavLink>
          </div>

          <button
            type="button"
            className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <div className="container-shell flex flex-col gap-2 py-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-100'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-200">
        <div className="container-shell grid gap-10 py-12 md:grid-cols-3">
          <div>
            <div className="mb-4 text-xl font-bold text-white">Manish Mishra Academy</div>
            <p className="text-sm text-slate-300">
              Focused academic coaching for Classes 7th to 12th with personal guidance, disciplined study habits, and modern learning support.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><NavLink to="/about">About</NavLink></li>
              <li><NavLink to="/courses">Courses</NavLink></li>
              <li><NavLink to="/facilities">Facilities</NavLink></li>
              <li><NavLink to="/contact">Contact</NavLink></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Contact</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Placeholder phone number</li>
              <li>Placeholder email address</li>
              <li>Placeholder academy address</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
