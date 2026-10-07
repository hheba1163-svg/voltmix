import { AdminHeader, AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <AdminHeader title="Dashboard" />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
