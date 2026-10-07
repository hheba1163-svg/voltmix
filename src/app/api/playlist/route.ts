import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSettings } from "@/lib/ads";
import { getVideoPlaybackUrl } from "@/lib/file-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const now = new Date();

  await prisma.advertisement.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });

  const settings = await getSettings();
  const ads = await prisma.advertisement.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    ads: ads.map((ad) => ({
      id: ad.id,
      organizationName: ad.organizationName,
      title: ad.title,
      videoUrl: getVideoPlaybackUrl(ad.videoUrl),
      expiresAt: ad.expiresAt.toISOString(),
      contactPhone: ad.contactPhone,
    })),
    settings: {
      websiteName: settings.websiteName,
      contactPhone: settings.contactPhone,
      contactText: settings.contactText,
      idleScreenText: settings.idleScreenText,
      videoFitMode: settings.videoFitMode,
      transitionDuration: settings.transitionDuration,
    },
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
