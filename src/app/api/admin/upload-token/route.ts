import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

const MAX_VIDEO_SIZE = 60 * 1024 * 1024;
const VIDEO_TYPES = ["video/mp4", "video/webm"];

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ clientUploads: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !["blob.generate-client-token", "blob.upload-completed"].includes(body.type)) {
    return NextResponse.json({ message: "Invalid upload request." }, { status: 400 });
  }

  if (body.type === "blob.generate-client-token" && !await getCurrentAdmin()) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^videos\/[a-f0-9-]+\.(mp4|webm)$/i.test(pathname)) {
          throw new Error("Invalid video path.");
        }

        return {
          allowedContentTypes: VIDEO_TYPES,
          maximumSizeInBytes: MAX_VIDEO_SIZE,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "Could not authorize video upload." }, { status: 400 });
  }
}