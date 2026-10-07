import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { deleteUploadedVideo } from "@/lib/file-store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  const ad = await prisma.advertisement.findUnique({ where: { id } });
  if (!ad) {
    return NextResponse.json({ message: "Advertisement not found." }, { status: 404 });
  }

  if (action === "pause") {
    if (ad.expiresAt <= new Date()) {
      return NextResponse.json({ message: "Advertisement has expired. Upload it again to start a new 24-hour window." }, { status: 409 });
    }
    await prisma.advertisement.update({
      where: { id },
      data: { status: "PAUSED" },
    });
    return NextResponse.json({ message: "Advertisement paused." });
  }

  if (action === "resume") {
    if (ad.expiresAt <= new Date()) {
      return NextResponse.json({ message: "Advertisement has expired. Upload it again to start a new 24-hour window." }, { status: 409 });
    }
    await prisma.advertisement.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
    return NextResponse.json({ message: "Advertisement resumed." });
  }

  return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const ad = await prisma.advertisement.findUnique({ where: { id } });
  if (!ad) {
    return NextResponse.json({ message: "Advertisement not found." }, { status: 404 });
  }

  await deleteUploadedVideo(ad.videoUrl);
  await prisma.advertisement.delete({ where: { id } });
  return NextResponse.json({ message: "Advertisement deleted." });
}
