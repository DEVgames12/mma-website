import { ArrowRight, BookOpen, Building2, Clock3, GraduationCap, Library, Wifi, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const highlights = [
  'Classes 7–12',
  'Smart Classrooms',
  'AC Rooms',
  'Library',
  'Fibre Internet',
  'Personal Guidance',
  'Quiet Study Environment',
];

const stats = [
  { label: 'Classes', value: '7–12' },
  { label: 'Focus', value: 'Personal' },
  { label: 'Learning', value: 'Concept-first' },
  { label: 'Support', value: 'Doubt Solving' },
];

export default function HomePage() {
  return (
    <>
      <section className="container-shell grid items-center gap-10 pb-16 pt-16 md:pt-20 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Premium academic learning
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            MANISH MISHRA ACADEMY
          </h1>
          <p className="mt-5 text-2xl font-semibold text-sky-700">Learn Better. Think Smarter. Achieve More.</p>
          <p className="mt-6 max-w-xl text-lg text-slate-600">
            Focused academic coaching for Classes 7th to 12th, with personal guidance, modern classrooms, dedicated study facilities and a quiet environment designed to help students learn with confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/courses" className="primary-button gap-2">
              Explore Classes <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="secondary-button">
              Enquire Now
            </Link>
            <Link to="/timetable" className="secondary-button">
              View Timetable
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Student &amp; Teacher Login</span>
            <Link to="/login" className="inline-flex items-center gap-1 text-sky-700 hover:underline">
              Access portal <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card-surface p-4">
                <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="card-surface overflow-hidden p-4 shadow-[0_20px_50px_rgba(14,116,144,0.14)]">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
              alt="Students learning together in a modern classroom"
              className="h-[520px] w-full rounded-2xl object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-5 rounded-2xl border border-sky-100 bg-white p-4 shadow-xl shadow-sky-100">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><ShieldCheck size={22} /></div>
              <div>
                <div className="text-sm text-slate-500">Academic support</div>
                <div className="font-semibold text-slate-900">Guided learning</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/70">
        <div className="container-shell flex flex-wrap justify-center gap-4 py-6 text-center text-sm font-medium text-slate-700">
          {highlights.map((item) => (
            <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="container-shell py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Why MMA</p>
          <h2 className="section-title mt-3">A structured learning environment that helps students grow</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: BookOpen, title: 'Concept-based learning', text: 'Students learn the fundamentals clearly rather than memorising without understanding.' },
            { icon: GraduationCap, title: 'Personal attention', text: 'Each learner gets guidance, support and academic monitoring in a focused setting.' },
            { icon: Building2, title: 'Smart classrooms', text: 'Modern teaching methods make lessons more interactive and easier to follow.' },
            { icon: Wifi, title: 'Fibre internet', text: 'Students can make productive use of free study time with online learning support.' },
            { icon: Library, title: 'Library access', text: 'A quiet, resourceful space for revision, reading and independent study.' },
            { icon: Clock3, title: 'Regular assessments', text: 'Frequent tests help identify learning gaps early and improve performance steadily.' },
            { icon: ShieldCheck, title: 'Disciplined environment', text: 'Punctuality, focus and consistency strengthen good study habits.' },
            { icon: ArrowRight, title: 'Doubt support', text: 'Students can ask questions and get timely guidance without confusion lingering for long.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card-surface p-6 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 inline-flex rounded-xl bg-sky-100 p-3 text-sky-700"><Icon size={22} /></div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="container-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">About MMA</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">A learning culture built around clarity, discipline and progress</h2>
            <p className="mt-5 text-slate-300">
              Manish Mishra Academy focuses on building strong academic fundamentals. Students are encouraged to understand concepts clearly, practice regularly, solve doubts confidently and improve with consistency.
            </p>
            <ul className="mt-6 space-y-4 text-slate-200">
              {['Conceptual learning', 'Regular practice', 'Doubt resolution', 'Academic monitoring', 'Student discipline', 'Consistent academic progress'].map((item) => (
                <li key={item} className="flex items-center gap-3"><span className="rounded-full bg-sky-500/20 p-1 text-sky-300">✓</span> {item}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { title: '01 — Learn', text: 'Understand the concept clearly in class.' },
              { title: '02 — Practice', text: 'Solve questions and assignments daily.' },
              { title: '03 — Ask', text: 'Clear doubts with faculty guidance.' },
              { title: '04 — Test', text: 'Track strengths and weak areas regularly.' },
              { title: '05 — Analyse', text: 'Review performance to identify improvements.' },
              { title: '06 — Improve', text: 'Repeat and strengthen the learning cycle.' },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">{step.title.split('—')[0].trim()}</div>
                <h3 className="mt-3 text-xl font-bold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
