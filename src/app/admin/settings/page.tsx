"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
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
  const [form, setForm] = useState({
    websiteName: "Voltmix",
    contactPhone: "+976 9911 2233",
    contactText: "Таны бизнесийг олон хүнд хүргэнэ.",
    videoFitMode: "cover",
    transitionDuration: 350,
    idleScreenText: "Таны сурталчилгаа энд байрлах боломжтой.",
  });
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/playlist", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load settings.");
      const data = await response.json();
      const settings = data.settings || {};
      setForm({
        websiteName: settings.websiteName ?? "Voltmix",
        contactPhone: settings.contactPhone ?? "+976 9911 2233",
        contactText: settings.contactText ?? "Таны бизнесийг олон хүнд хүргэнэ.",
        videoFitMode: settings.videoFitMode ?? "cover",
        transitionDuration: settings.transitionDuration ?? 350,
        idleScreenText: settings.idleScreenText ?? "Таны сурталчилгаа энд байрлах боломжтой.",
      });
      setIsLoading(false);
    };
    void load().catch(() => setStatus("Тохиргоог ачаалж чадсангүй. Хуудсыг дахин ачаална уу."));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Settings could not be saved.");
    setStatus(data.message || "Settings updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Settings could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-2 text-sm text-slate-500">Configure the public display identity and billboard behavior.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <fieldset disabled={isLoading || isSaving} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Website Name</label>
            <input value={form.websiteName} onChange={(e) => setForm({ ...form, websiteName: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Contact Phone Number</label>
            <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Secondary Contact Text</label>
          <input value={form.contactText} onChange={(e) => setForm({ ...form, contactText: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Default Video Transition</label>
            <input type="number" min={0} max={1000} value={form.transitionDuration} onChange={(e) => setForm({ ...form, transitionDuration: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Video Fit Mode</label>
            <select value={form.videoFitMode} onChange={(e) => setForm({ ...form, videoFitMode: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Idle Screen Text</label>
          <textarea value={form.idleScreenText} onChange={(e) => setForm({ ...form, idleScreenText: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
        </div>

        <button type="submit" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          {isSaving ? "Saving..." : isLoading ? "Loading..." : "Save settings"}
        </button>
        </fieldset>

        {status ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
      </form>
    </div>
  );
}
