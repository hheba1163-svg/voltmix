import prisma from "@/lib/prisma";
import { ensureSeedData } from "@/lib/seed";

export type PublicAdvertisement = {
  id: string;
  organizationName: string;
  title: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  displayOrder: number;
  createdAt: Date;
  activatedAt: Date;
  expiresAt: Date;
  contactPhone: string | null;
  notes: string | null;
};

export async function getSettings() {
  await ensureSeedData();
  const settings = await prisma.settings.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (settings) {
    return settings;
  }

  return {
    id: "default",
    websiteName: "Voltmix",
    logoUrl: null,
    contactPhone: "+976 9911 2233",
    contactText: "Зар сурталчилгаа байршуулах",
    videoFitMode: "cover",
    transitionDuration: 350,
    idleScreenText: "Таны сурталчилгаа энд байрлах боломжтой.",
    updatedAt: new Date(),
  };
}

export async function getPublicAds() {
  await ensureSeedData();
  const now = new Date();

  const rows = await prisma.advertisement.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: {
        gt: now,
      },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  return rows as PublicAdvertisement[];
}

export function getRemainingTime(expiresAt: Date) {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) {
    return { totalMs: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalMs: diff,
    hours,
    minutes,
    seconds,
  };
}

export function isExpiringSoon(expiresAt: Date) {
  return getRemainingTime(expiresAt).totalMs <= 3 * 60 * 60 * 1000;
}

export async function getDashboardSummary() {
  await ensureSeedData();
  const now = new Date();
  const [total, active, paused, expired, settings] = await Promise.all([
    prisma.advertisement.count(),
    prisma.advertisement.count({
      where: {
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
    }),
    prisma.advertisement.count({ where: { status: "PAUSED", expiresAt: { gt: now } } }),
    prisma.advertisement.count({
      where: {
        OR: [{ status: "EXPIRED" }, { expiresAt: { lte: now } }],
      },
    }),
    getSettings(),
  ]);

  const expiringSoon = await prisma.advertisement.count({
    where: {
      status: "ACTIVE",
      expiresAt: {
        gt: now,
        lte: new Date(now.getTime() + 1000 * 60 * 60 * 3),
      },
    },
  });

  let storageUsage = 0;
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const entries = await fs.readdir(uploadDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const stat = await fs.stat(path.join(uploadDir, entry.name));
        storageUsage += stat.size;
      }
    }
  } catch {
    storageUsage = 0;
  }

  return {
    total,
    active,
    paused,
    expiringSoon,
    expired,
    storageUsage,
    settings,
  };
}
