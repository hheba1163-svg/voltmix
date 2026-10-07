import { redirect } from "next/navigation";
import { AdvertisementTable } from "@/components/AdvertisementTable";
import { getCurrentAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getVideoPlaybackUrl } from "@/lib/file-store";

export default async function ExpiredPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const ads = await prisma.advertisement.findMany({
    where: { OR: [{ status: "EXPIRED" }, { expiresAt: { lte: new Date() } }] },
    orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Expired advertisements</h2>
        <p className="mt-1 text-sm text-slate-500">These videos are archived for history and no longer appear on the public display.</p>

        <div className="mt-5">
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
    </div>
  );
}
