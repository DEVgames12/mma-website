const times = ['4:00 PM – 5:00 PM', '5:00 PM – 6:00 PM', '6:00 PM – 7:00 PM'];

export default function TimetablePage() {
  return (
    <div className="container-shell py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Timetable</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">Daily batch schedule</h1>
      </div>

      <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="grid grid-cols-4 bg-slate-900 text-white">
          <div className="px-6 py-4 font-semibold">Time</div>
          <div className="px-6 py-4 font-semibold">Batch</div>
          <div className="px-6 py-4 font-semibold">Class</div>
          <div className="px-6 py-4 font-semibold">Room</div>
        </div>
        {times.map((time) => (
          <div key={time} className="grid grid-cols-4 border-t border-slate-200 text-slate-700">
            <div className="px-6 py-5 font-medium">{time}</div>
            <div className="px-6 py-5">Batch</div>
            <div className="px-6 py-5">Editable</div>
            <div className="px-6 py-5">To be assigned</div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-6 text-slate-700">
        This timetable is intentionally designed for easy database updates later. Administrators can assign class, subject, teacher, day, batch, room and time slots as needed.
      </div>
    </div>
  );
}
