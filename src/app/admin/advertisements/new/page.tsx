"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

export default function NewAdvertisementPage() {
  const router = useRouter();
  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch("/api/admin/login", { cache: "no-store" });
      const data = await response.json().catch(() => ({ authenticated: false }));
      if (!data.authenticated) {
        router.replace("/admin/login");
      }
    };
    void checkAuth();
  }, [router]);
  const [statusText, setStatusText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function validateVideoFile(file: File) {
    const url = URL.createObjectURL(file);
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve({ width: video.videoWidth, height: video.videoHeight });
        };
        video.onerror = () => reject(new Error("Failed to read video metadata."));
        video.src = url;
      });

      if (dimensions.width > 0 && dimensions.height > 0) {
        const ratio = dimensions.width / dimensions.height;
        if (Math.abs(ratio - 9 / 16) > 0.2) {
          setStatusText("Энэ бичлэг 9:16 харьцаатай биш байна. Дэлгэц дээр хоосон зай эсвэл crop үүсэж болзошгүй.");
        }
      }
    } catch {
      // ignore metadata errors; upload can still proceed
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("video") as File | null;

    if (!file || file.size === 0) {
      setStatusText("Please select a valid video file.");
      return;
    }

    const allowed = ["video/mp4", "video/webm"];
    if (!allowed.includes(file.type) && !/\.(mp4|webm)$/i.test(file.name)) {
      setStatusText("Unsupported video type. Use .mp4 or .webm.");
      return;
    }

    if (file.size > 60 * 1024 * 1024) {
      setStatusText("Video exceeds the 60 MB limit.");
      return;
    }

    setIsUploading(true);
    setStatusText("Uploading and activating advertisement...");

    try {
      const capability = await fetch("/api/admin/upload-token", { cache: "no-store" });
      const capabilityData = await capability.json().catch(() => ({}));
      let response: Response;

      if (capability.ok && capabilityData.clientUploads) {
        const extension = /\.webm$/i.test(file.name) || file.type === "video/webm" ? "webm" : "mp4";
        const blob = await upload(`videos/${crypto.randomUUID()}.${extension}`, file, {
          access: "public",
          contentType: file.type || `video/${extension}`,
          handleUploadUrl: "/api/admin/upload-token",
          multipart: file.size > 5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            setStatusText(`Uploading video... ${Math.round(percentage)}%`);
          },
        });
        response = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: blob.url,
            organizationName: formData.get("organizationName"),
            title: formData.get("title"),
            displayOrder: formData.get("displayOrder"),
            status: formData.get("status"),
            contactPhone: formData.get("contactPhone"),
            notes: formData.get("notes"),
          }),
        });
      } else {
        response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();
      if (response.ok) {
        const expiry = data.expiresAt ? new Date(data.expiresAt).toLocaleString("en-GB") : "";
        setStatusText(`${data.message || "Advertisement uploaded successfully."} Expiry: ${expiry}`);
        form.reset();
        setSelectedFile(null);
      } else {
        setStatusText(data.message || "Advertisement upload failed.");
      }
    } catch {
      setStatusText("Upload failed. Please check the file and try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Upload advertisement</h1>
        <p className="text-sm text-slate-500">Set the organization, title, order and expiry. The ad will become active immediately.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">Organization Name *</label>
            <input name="organizationName" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">Advertisement Title</label>
            <input name="title" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Video File *</label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100">
            <UploadCloud className="mb-3 h-8 w-8 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Choose MP4 or WebM file</span>
            <span className="mt-1 text-xs text-slate-500">Recommended 1080 x 1920 / 9:16</span>
            <input
              type="file"
              name="video"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                if (file) {
                  await validateVideoFile(file);
                }
              }}
            />
          </label>
          {selectedFile ? <div className="mt-2 text-xs text-slate-600">Selected: {selectedFile.name}</div> : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Display Order</label>
            <input name="displayOrder" type="number" defaultValue={0} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select name="status" defaultValue="ACTIVE" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400">
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
            <input name="contactPhone" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
            <input name="notes" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400" />
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          The system automatically sets activation time to now and calculates a 24-hour expiry window.
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload and activate"}
        </button>

        {statusText ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {statusText}
          </div>
        ) : null}
      </form>
    </div>
  );
}
