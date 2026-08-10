export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff)]">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#0f4c81]" />
        <p className="text-sm font-medium text-slate-700">Loading Atlas demo…</p>
      </div>
    </main>
  );
}
