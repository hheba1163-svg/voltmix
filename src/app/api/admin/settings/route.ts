import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/ads";

const settingsSchema = z.object({
  websiteName: z.string().trim().min(1).max(200).optional(),
  contactPhone: z.string().trim().max(100).optional(),
  contactText: z.string().trim().max(2000).optional(),
  idleScreenText: z.string().trim().max(2000).optional(),
  videoFitMode: z.enum(["cover", "contain"]).optional(),
  transitionDuration: z.number().int().min(0).max(1000).optional(),
}).strict();

export async function PATCH(request: Request) {
  if (!await getCurrentAdmin()) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid settings.", errors: parsed.error.flatten() }, { status: 400 });
  }
  const existing = await getSettings();
  const settings = await prisma.settings.update({ where: { id: existing.id }, data: parsed.data });
  return NextResponse.json({ message: "Settings updated.", settings });
}
