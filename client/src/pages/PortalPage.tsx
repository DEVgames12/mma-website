import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type PortalData = {
  user?: { fullName?: string; role?: string };
  students?: number;
  teachers?: number;
  enquiries?: number;
  courses?: number;
  resources?: number;
  timetable?: Array<{ day: string; subject?: string; startTime: string; endTime: string }>;
  announcements?: Array<{ title: string; message: string }>;
  tests?: Array<{ title: string; date?: string; status: string }>;
  assignments?: Array<{ className: string; subject: string; batch?: string }>;
  notifications?: Array<{ title: string; message: string }>;
  enrollments?: Array<{ className: string; subject: string; batch?: string }>;
  assignedTeachers?: Array<{ className: string; subject: string; teacher?: { user?: { fullName?: string; email?: string } } }>;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function PortalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<PortalData>({});
  const [error, setError] = useState('');

  const isAdmin = location.pathname.startsWith('/admin');
  const roleLabel = isAdmin ? 'Administration portal' : location.pathname.startsWith('/teacher') ? 'Teacher portal' : 'Student portal';
  const endpoint = isAdmin ? '/api/admin/dashboard' : location.pathname.startsWith('/teacher') ? '/api/teacher/dashboard' : '/api/student/dashboard';

  useEffect(() => {
    fetch(`${API_URL}${endpoint}`, { credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to load this portal.');
        setData(payload.data || {});
      })
      .catch((portalError: unknown) => {
        setError(portalError instanceof Error ? portalError.message : 'Unable to load this portal.');
      });
  }, [endpoint]);

  async function logout() {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    navigate('/login');
  }

  const stats = [
    ['Students', data.students],
    ['Teachers', data.teachers],
    ['Enquiries', data.enquiries],
    ['Courses', data.courses],
  ].filter(([, value]) => value !== undefined);

  return (
    <div className="container-shell py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{roleLabel}</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">Welcome back{data.user?.fullName ? `, ${data.user.fullName}` : ''}</h1>
          <p className="mt-3 text-slate-600">Your MMA workspace is ready with access controlled by your account role.</p>
        </div>
        <button type="button" onClick={logout} className="secondary-button">Sign out</button>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {location.pathname.startsWith('/student') && <><a className="secondary-button" href="/student/resources">Study material</a><a className="secondary-button" href="/student/tests">Tests</a><a className="secondary-button" href="/student/timetable">Timetable</a><a className="secondary-button" href="/student/fees">Fees</a></>}
        {location.pathname.startsWith('/teacher') && <><a className="secondary-button" href="/teacher/resources">My resources</a><a className="secondary-button" href="/teacher/tests">Tests</a><a className="secondary-button" href="/teacher/timetable">Timetable</a></>}
        {isAdmin && <><a className="secondary-button" href="/admin/tests">All tests</a><a className="secondary-button" href="/admin/fees">Fees</a><a className="secondary-button" href="/admin/payments">Payments</a></>}
      </div>

      {error ? (
        <div className="card-surface mt-8 p-6 text-red-700">{error}. Please sign in again.</div>
      ) : (
        <>
          {stats.length > 0 && (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(([label, value]) => (
                <div className="card-surface p-6" key={label as string}>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          )}

          {data.assignments && data.assignments.length > 0 && <section className="mt-10"><h2 className="section-title text-2xl">Classes I Teach</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{data.assignments.map((item) => <div className="card-surface p-5" key={`${item.className}-${item.subject}`}><p className="font-semibold text-slate-900">{item.className}</p><p className="mt-2 text-sm text-slate-600">{item.subject}{item.batch ? ` · ${item.batch}` : ''}</p></div>)}</div></section>}

          {data.enrollments && data.enrollments.length > 0 && <section className="mt-10"><h2 className="section-title text-2xl">My Classes & Subjects</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{data.enrollments.map((item) => <div className="card-surface p-5" key={`${item.className}-${item.subject}`}><p className="font-semibold text-slate-900">{item.className}</p><p className="mt-2 text-sm text-slate-600">{item.subject}{item.batch ? ` · ${item.batch}` : ''}</p></div>)}</div></section>}

          {data.assignedTeachers && data.assignedTeachers.length > 0 && <section className="mt-10"><h2 className="section-title text-2xl">My Teachers</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{data.assignedTeachers.map((item) => <div className="card-surface p-5" key={`${item.subject}-${item.teacher?.user?.email}`}><p className="font-semibold text-slate-900">{item.subject}</p><p className="mt-2 text-sm text-slate-600">{item.teacher?.user?.fullName || 'Assigned faculty'}</p></div>)}</div></section>}

          {data.timetable && data.timetable.length > 0 && (
            <section className="mt-10">
              <h2 className="section-title text-2xl">Upcoming timetable</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {data.timetable.map((item, index) => (
                  <div className="card-surface p-5" key={`${item.day}-${index}`}>
                    <p className="font-semibold text-slate-900">{item.day} · {item.subject || 'Class session'}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.startTime} - {item.endTime}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.announcements && data.announcements.length > 0 && (
            <section className="mt-10">
              <h2 className="section-title text-2xl">Announcements</h2>
              <div className="mt-5 space-y-4">
                {data.announcements.map((item) => <div className="card-surface p-5" key={item.title}><h3 className="font-semibold text-slate-900">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.message}</p></div>)}
              </div>
            </section>
          )}

          {data.tests && data.tests.length > 0 && (
            <section className="mt-10">
              <h2 className="section-title text-2xl">Tests</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {data.tests.map((item) => <div className="card-surface p-5" key={item.title}><h3 className="font-semibold text-slate-900">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.date || 'Date to be announced'} · {item.status}</p></div>)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}