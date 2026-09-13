import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const courseHighlights = [
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Physics',
  'Chemistry',
  'Mathematics',
];

export default function CoursesPage() {
  return (
    <div className="container-shell py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Courses</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">Academic pathways for every stage</h1>
        <p className="mt-5 text-lg text-slate-600">Structured support for students from Classes 7th to 12th.</p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {courseHighlights.map((item) => (
          <span key={item} className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">{item}</span>
        ))}
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Link to="/courses/classes-7-10" className="card-surface block p-8 transition hover:-translate-y-1 hover:shadow-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Classes 7–10</div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">Foundation years</h2>
          <p className="mt-4 text-slate-600">A complete academic base with major subject coverage, concept-building and regular assessments.</p>
          <div className="mt-6 inline-flex items-center gap-2 font-semibold text-sky-700">
            Explore class-wise courses <ArrowRight size={18} />
          </div>
        </Link>

        <Link to="/courses/classes-11-12" className="card-surface block p-8 transition hover:-translate-y-1 hover:shadow-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Classes 11–12</div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">Subject-specialised batches</h2>
          <p className="mt-4 text-slate-600">Separate batches for Physics, Chemistry and Mathematics with focused preparation and guidance.</p>
          <div className="mt-6 inline-flex items-center gap-2 font-semibold text-sky-700">
            Explore senior courses <ArrowRight size={18} />
          </div>
        </Link>
      </div>
    </div>
  );
}
