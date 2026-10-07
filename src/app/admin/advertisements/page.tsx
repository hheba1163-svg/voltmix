import { redirect } from "next/navigation";
import { AdvertisementTable } from "@/components/AdvertisementTable";
import { getCurrentAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getVideoPlaybackUrl } from "@/lib/file-store";

export default async function AdvertisementsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const ads = await prisma.advertisement.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Advertisements</h2>
            <p className="text-sm text-slate-500">Manage rotation, status and expiration.</p>
          </div>
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
            videoUrl: getVideoPlaybackUrl(ad.videoUrl),
          }))}
        />
      </div>
    </div>
  );
}
