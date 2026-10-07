import Link from "next/link";
import { Film, LayoutGrid, LogOut, Settings, Shield, Upload, Video } from "lucide-react";

const items = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/advertisements", label: "Advertisements", icon: Video },
  { href: "/admin/advertisements/new", label: "Upload Video", icon: Upload },
  { href: "/admin/expired", label: "Expired", icon: Video },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-72 border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
          <Film className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <div className="text-lg font-semibold">Voltmix</div>
          <div className="text-xs text-slate-400">Digital Billboard</div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <form action="/api/admin/logout" method="POST" className="w-full">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Operations</p>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <Shield className="h-3.5 w-3.5" />
          Protected admin
        </div>
      </div>
    </header>
  );
}
