"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Pause, Play, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export type AdminAdvertisement = {
  id: string;
  organizationName: string;
  title: string | null;
  status: string;
  displayOrder: number;
  createdAt: string;
  expiresAt: string;
  contactPhone: string | null;
  notes: string | null;
  videoUrl: string;
};

export function AdvertisementTable({ ads }: { ads: AdminAdvertisement[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const initial = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 1000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, []);

  async function updateAdvertisement(id: string, action: "pause" | "resume" | "delete") {
    if (action === "delete") {
      const ok = window.confirm("Энэ сурталчилгааг устгахдаа итгэлтэй байна уу?");
      if (!ok) return;
    }

    setLoadingId(id);
    try {
    const url = `/api/admin/advertisements/${id}`;
    const response = await fetch(url, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: action === "delete" ? undefined : JSON.stringify({ action }),
    });

    setLoadingId(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: "Action failed" }));
      alert(data.message || "Action failed");
      return;
    }

    window.location.reload();
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  function formatDate(dateValue: string) {
    return new Date(dateValue).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (!ads.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        No advertisements found yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {ads.map((ad) => {
              const remainingMs = now === null ? Infinity : new Date(ad.expiresAt).getTime() - now;
              const statusLabel = remainingMs <= 0 ? "EXPIRED" : ad.status === "ACTIVE" && remainingMs <= 3 * 60 * 60 * 1000 ? "EXPIRING SOON" : ad.status;

              return (
              <tr key={ad.id} className="align-middle">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-14 overflow-hidden rounded-md bg-slate-200">
                      <video
                        src={ad.videoUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{ad.organizationName}</div>
                      <div className="text-xs text-slate-500">{ad.contactPhone || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{ad.title || "Untitled"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={statusLabel} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(ad.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(ad.expiresAt)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{ad.displayOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href="/display"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Link>
                    {statusLabel === "EXPIRED" ? (
                      <span className="px-2 py-1.5 text-xs text-slate-500">Expired</span>
                    ) : ad.status === "PAUSED" ? (
                      <button
                        onClick={() => updateAdvertisement(ad.id, "resume")}
                        disabled={loadingId === ad.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => updateAdvertisement(ad.id, "pause")}
                        disabled={loadingId === ad.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </button>
                    )}
                    <button
                      onClick={() => updateAdvertisement(ad.id, "delete")}
                      disabled={loadingId === ad.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
