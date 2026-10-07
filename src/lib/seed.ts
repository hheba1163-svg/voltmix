import { hash } from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import prisma from "@/lib/prisma";

export async function syncConfiguredAdmin(email: string, password: string) {
  const configuredEmail = (process.env.ADMIN_EMAIL?.trim() || "admin@voltmix.local").toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin1234");

  if (email !== configuredEmail || !configuredPassword) {
    return null;
  }

  const providedPassword = Buffer.from(password);
  const expectedPassword = Buffer.from(configuredPassword);
  if (
    providedPassword.length !== expectedPassword.length ||
    !timingSafeEqual(providedPassword, expectedPassword)
  ) {
    return null;
  }

  const passwordHash = await hash(configuredPassword, 10);
  return prisma.admin.upsert({
    where: { email: configuredEmail },
    update: { passwordHash },
    create: {
      email: configuredEmail,
      passwordHash,
    },
  });
}

export async function ensureSeedData() {
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const email = (process.env.ADMIN_EMAIL?.trim() || "admin@voltmix.local").toLowerCase();
    const password = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin1234");
    if (!password) {
      throw new Error("ADMIN_PASSWORD must be configured before the production admin account is created.");
    }

    await prisma.admin.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: await hash(password, 10),
      },
    });
  }

  const settingsCount = await prisma.settings.count();
  if (settingsCount === 0) {
    await prisma.settings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        websiteName: "Voltmix",
        contactPhone: "+976 9911 2233",
        contactText: "Таны бизнесийг олон хүнд хүргэнэ.",
        videoFitMode: "cover",
        transitionDuration: 350,
        idleScreenText: "Таны сурталчилгаа энд байрлах боломжтой.",
      },
    });
  }
}
