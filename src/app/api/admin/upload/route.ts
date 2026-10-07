import { NextResponse } from "next/server";
import { head } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { ACCEPTED_VIDEO_TYPES, saveUploadedVideo, deleteUploadedVideo } from "@/lib/file-store";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const isDirectUpload = request.headers.get("content-type")?.includes("application/json");
  const formData = isDirectUpload ? null : await request.formData();
  const body = isDirectUpload ? await request.json().catch(() => ({})) : null;
  const organizationName = String((body?.organizationName ?? formData?.get("organizationName")) || "").trim();
  const title = String((body?.title ?? formData?.get("title")) || "").trim();
  const displayOrder = Number((body?.displayOrder ?? formData?.get("displayOrder")) || 0);
  const status = String((body?.status ?? formData?.get("status")) || "ACTIVE");
  const contactPhone = String((body?.contactPhone ?? formData?.get("contactPhone")) || "").trim();
  const notes = String((body?.notes ?? formData?.get("notes")) || "").trim();

  if (!organizationName || !Number.isSafeInteger(displayOrder) || displayOrder < 0 || !["ACTIVE", "PAUSED"].includes(status)) {
    return NextResponse.json({ message: "Invalid display order or status." }, { status: 400 });
  }

  let storedUrl: string;
  if (isDirectUpload) {
    const videoUrl = String(body?.videoUrl || "");
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(videoUrl);
    } catch {
      return NextResponse.json({ message: "Uploaded video URL is invalid." }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN || !parsedUrl.hostname.endsWith(".public.blob.vercel-storage.com") || !parsedUrl.pathname.startsWith("/videos/")) {
      return NextResponse.json({ message: "Uploaded video is not in the configured storage." }, { status: 400 });
    }

    try {
      const blob = await head(videoUrl);
      if (blob.size <= 0 || blob.size > 60 * 1024 * 1024 || !ACCEPTED_VIDEO_TYPES.includes(blob.contentType)) {
        await deleteUploadedVideo(videoUrl);
        return NextResponse.json({ message: "Unsupported or oversized video. Use MP4 or WebM under 60 MB." }, { status: 400 });
      }
      storedUrl = blob.url;
    } catch {
      return NextResponse.json({ message: "Uploaded video could not be verified." }, { status: 400 });
    }
  } else {
    const file = formData?.get("video");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "Video file is required." }, { status: 400 });
    }

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type) && !/\.(mp4|webm)$/i.test(file.name)) {
      return NextResponse.json({ message: "Unsupported video type. Use MP4 or WebM." }, { status: 400 });
    }

    if (file.size > 60 * 1024 * 1024) {
      return NextResponse.json({ message: "Video exceeds the 60 MB limit." }, { status: 400 });
    }
    storedUrl = await saveUploadedVideo(file);
  }

  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt.getTime() + 24 * 60 * 60 * 1000);

  const ad = await prisma.advertisement.create({
    data: {
      organizationName,
      title: title || "Untitled Advertisement",
      videoUrl: storedUrl,
      status: status === "PAUSED" ? "PAUSED" : "ACTIVE",
      displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
      contactPhone: contactPhone || null,
      notes: notes || null,
      activatedAt,
      expiresAt,
    },
  }).catch(async (error) => {
    await deleteUploadedVideo(storedUrl);
    throw error;
  });

  return NextResponse.json({
    message: "Сурталчилгаа амжилттай нэмэгдлээ.",
    ad,
    expiresAt: expiresAt.toISOString(),
  });
}
