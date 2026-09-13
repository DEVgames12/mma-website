const classes = [
  {
    title: 'Class 7',
    subjects: ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi'],
    details: ['Concept building', 'Practice', 'Homework support', 'Regular tests', 'Doubt solving', 'Academic guidance'],
  },
  {
    title: 'Class 8',
    subjects: ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi'],
    details: ['Concept building', 'Practice', 'Homework support', 'Regular tests', 'Doubt solving', 'Academic guidance'],
  },
  {
    title: 'Class 9',
    subjects: ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi'],
    details: ['Concept building', 'Practice', 'Homework support', 'Regular tests', 'Doubt solving', 'Academic guidance'],
  },
  {
    title: 'Class 10',
    subjects: ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi'],
    details: ['Concept building', 'Practice', 'Homework support', 'Regular tests', 'Doubt solving', 'Academic guidance'],
  },
];

export default function Classes710Page() {
  return (
    <div className="container-shell py-16 md:py-20">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Classes 7–10</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">Complete academic coaching</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {classes.map((course) => (
          <div key={course.title} className="card-surface p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{course.title}</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{course.title}</h2>
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Subjects covered</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {course.subjects.map((subject) => (
                  <span key={subject} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{subject}</span>
                ))}
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-slate-600">
              {course.details.map((item) => (
                <li key={item} className="flex items-center gap-3"><span className="rounded-full bg-sky-100 p-1 text-sky-700">✓</span> {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
