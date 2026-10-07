import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, Clock3, Film, FolderOpen, TimerReset } from "lucide-react";
import { AdvertisementTable } from "@/components/AdvertisementTable";
import { getCurrentAdmin } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/ads";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const summary = await getDashboardSummary();
  const ads = await prisma.advertisement.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    take: 25,
  });

  const cards = [
    { label: "Active Ads", value: summary.active.toString(), icon: Film },
    { label: "Expiring Soon", value: summary.expiringSoon.toString(), icon: Clock3 },
    { label: "Expired Ads", value: summary.expired.toString(), icon: TimerReset },
    { label: "Total Uploaded", value: summary.total.toString(), icon: FolderOpen },
    {
      label: "Storage Usage",
      value: `${(summary.storageUsage / 1024 / 1024).toFixed(1)} MB`,
      icon: FolderOpen,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">{value}</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent advertisements</h2>
            <p className="text-sm text-slate-500">Monitor rotation and expiration</p>
          </div>
          <Link
            href="/admin/advertisements/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Camera className="h-4 w-4" />
            Upload video
          </Link>
        </div>

        <AdvertisementTable
          ads={ads.map((ad) => ({
            id: ad.id,
            organizationName: ad.organizationName,
            title: ad.title,
            status: ad.status,
            displayOrder: ad.displayOrder,
            createdAt: ad.createdAt.toISOString(),
            expiresAt: ad.expiresAt.toISOString(),
            contactPhone: ad.contactPhone,
            notes: ad.notes,
            videoUrl: ad.videoUrl,
          }))}
        />
      </div>
    </div>
  );
}
