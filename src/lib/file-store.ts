import { del, put } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];

export function getVideoPlaybackUrl(videoUrl: string) {
  return videoUrl.startsWith("/uploads/") ? `/api/media/${encodeURIComponent(videoUrl.slice(9))}` : videoUrl;
}

export async function saveUploadedVideo(file: File) {
  const name = file.name || "video-upload";
  const sourceExtension = path.extname(name).toLowerCase();
  const ext = sourceExtension === ".webm" || sourceExtension === ".mp4"
    ? sourceExtension
    : file.type === "video/webm" ? ".webm" : ".mp4";
  const fileNameWithExt = `${Date.now()}-${randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`videos/${fileNameWithExt}`, file, {
      access: "public",
      contentType: file.type || (ext === ".webm" ? "video/webm" : "video/mp4"),
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error("Video storage is not configured. Connect a Vercel Blob store.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileNameWithExt);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/uploads/${fileNameWithExt}`;
}

export async function deleteUploadedVideo(videoUrl: string) {
  if (videoUrl.startsWith("https://") && process.env.BLOB_READ_WRITE_TOKEN) {
    const hostname = new URL(videoUrl).hostname;
    if (hostname.endsWith(".public.blob.vercel-storage.com")) {
      await del(videoUrl);
    }
    return;
  }

  if (!videoUrl.startsWith("/uploads/")) {
    return;
  }

  const resolved = path.join(process.cwd(), "public", videoUrl.replace(/^\//, ""));
  if (path.dirname(resolved) !== path.join(process.cwd(), "public", "uploads")) return;
  try {
    await fs.unlink(resolved);
  } catch {
    // Ignore if file already missing.
  }
}
