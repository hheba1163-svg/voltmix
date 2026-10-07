export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PAUSED: "bg-amber-100 text-amber-700 border-amber-200",
    EXPIRED: "bg-rose-100 text-rose-700 border-rose-200",
    "EXPIRING SOON": "bg-orange-100 text-orange-700 border-orange-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${styles[normalized] || "bg-slate-100 text-slate-700 border-slate-200"}`}
    >
      {normalized}
    </span>
  );
}
