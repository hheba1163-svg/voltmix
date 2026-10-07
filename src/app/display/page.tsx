import { PublicDisplayClient } from "@/components/PublicDisplayClient";
import { getPublicAds, getSettings } from "@/lib/ads";
import { getVideoPlaybackUrl } from "@/lib/file-store";
import { connection } from "next/server";

export default async function DisplayPage() {
  await connection();
  const [settings, ads] = await Promise.all([getSettings(), getPublicAds()]);

  return (
    <PublicDisplayClient
      initialAds={ads.map((ad) => ({
        id: ad.id,
        organizationName: ad.organizationName,
        title: ad.title,
        videoUrl: getVideoPlaybackUrl(ad.videoUrl),
        expiresAt: ad.expiresAt.toISOString(),
        contactPhone: ad.contactPhone,
      }))}
      initialSettings={{
        websiteName: settings.websiteName,
        contactPhone: settings.contactPhone,
        contactText: settings.contactText,
        idleScreenText: settings.idleScreenText,
        videoFitMode: settings.videoFitMode,
        transitionDuration: settings.transitionDuration,
      }}
    />
  );
}
