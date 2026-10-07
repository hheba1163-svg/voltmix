import { open } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";

async function serve(request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename) || filename === "." || filename === "..") {
    return new Response(null, { status: 404 });
  }
  const file = await open(path.join(process.cwd(), "public", "uploads", filename), "r").catch(() => null);
  if (!file) return new Response(null, { status: 404 });
  const { size } = await file.stat();
  const headers = new Headers({
    "Content-Type": /\.webm$/i.test(filename) ? "video/webm" : /\.mov$/i.test(filename) ? "video/quicktime" : "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  });
  let start = 0;
  let end = size - 1;
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match && (match[1] || match[2])) {
      start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    } else start = size;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
      await file.close();
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  }
  headers.set("Content-Length", String(Math.max(0, end - start + 1)));
  if (request.method === "HEAD" || size === 0) {
    await file.close();
    return new Response(null, { status: range ? 206 : 200, headers });
  }
  const stream = file.createReadStream({ start, end, autoClose: true });
  return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { status: range ? 206 : 200, headers });
}

export const GET = serve;
export const HEAD = serve;
