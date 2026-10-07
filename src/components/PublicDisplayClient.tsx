"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export type PlaylistItem = {
  id: string;
  organizationName: string;
  title: string | null;
  videoUrl: string;
  expiresAt: string;
  contactPhone: string | null;
};

export type PublicSettings = {
  websiteName: string;
  contactPhone: string;
  contactText: string;
  idleScreenText: string;
  videoFitMode: string;
  transitionDuration: number;
};

export function PublicDisplayClient({ initialSettings, initialAds }: { initialSettings: PublicSettings; initialAds: PlaylistItem[] }) {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(initialAds);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const transitionDuration = Number(settings.transitionDuration ?? 350);
  const currentItem = playlist[activeIndex % playlist.length] ?? null;
  const currentIdRef = useRef<string | null>(initialAds[0]?.id ?? null);
  const transitionTimer = useRef<number | undefined>(undefined);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    currentIdRef.current = currentItem?.id ?? null;
  }, [currentItem?.id]);

  useEffect(() => {
    let stopped = false;
    let fetching = false;
    const controller = new AbortController();
    async function syncPlaylist() {
      if (fetching) return;
      fetching = true;
      try {
        const response = await fetch("/api/playlist", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Playlist unavailable");
        const data = await response.json();
        if (stopped) return;
        const ads: PlaylistItem[] = data.ads ?? [];
        const preservedIndex = ads.findIndex((ad) => ad.id === currentIdRef.current);
        setSettings(data.settings);
        setPlaylist(ads);
        setActiveIndex(preservedIndex >= 0 ? preservedIndex : 0);
      } catch {
        // Preserve the last successful playlist during temporary network failures.
      } finally {
        fetching = false;
      }
    }
    void syncPlaylist();
    const interval = window.setInterval(() => void syncPlaylist(), 5000);
    const refresh = () => void syncPlaylist();
    window.addEventListener("focus", refresh);
    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(interval);
      window.clearTimeout(transitionTimer.current);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  function advancePlaylist(delay = transitionDuration) {
    window.clearTimeout(transitionTimer.current);
    setIsTransitioning(true);
    transitionTimer.current = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % playlist.length);
      setIsTransitioning(false);
    }, delay);
  }

  const fitMode = settings.videoFitMode === "contain" ? "contain" : "cover";

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;

    const enableSound = !soundEnabled;
    video.muted = !enableSound;
    setSoundEnabled(enableSound);
    setAudioError(false);

    if (enableSound) {
      void video.play().catch(() => {
        if (videoRef.current !== video) return;
        video.muted = true;
        setSoundEnabled(false);
        setAudioError(true);
      });
    }
  }

  if (!playlist.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1f2937,_#020617_55%)] px-6 text-center text-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-3xl font-semibold tracking-tight">{settings.websiteName}</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <p className="text-xl font-medium">{settings.idleScreenText}</p>
            <div className="mt-6 text-sm text-slate-300">
              <p>{settings.contactText}</p>
              <p className="mt-2 text-lg font-semibold text-amber-300">{settings.contactPhone}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-3 py-4 text-white">
      <div className="relative h-[calc(100vh-1.5rem)] w-full max-w-[420px] overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <header className="flex h-[10%] items-center justify-center border-b border-slate-800 bg-slate-950/85 px-6 text-center backdrop-blur-sm">
          <div className="text-lg font-semibold tracking-[0.18em] text-slate-100">{settings.websiteName}</div>
        </header>

        <main className="relative h-[78%] overflow-hidden bg-black">
          <div
            className="absolute inset-0 transition-opacity ease-out"
            style={{
              opacity: isTransitioning ? 0.35 : 1,
              transitionDuration: `${transitionDuration}ms`,
            }}
          >
            <video
              key={currentItem?.id}
              src={currentItem?.videoUrl}
              ref={videoRef}
              className="h-full w-full object-cover"
              style={{ objectFit: fitMode }}
              muted={!soundEnabled}
              playsInline
              autoPlay
              preload="auto"
              loop={playlist.length === 1}
              onCanPlay={(event) => {
                const video = event.currentTarget;
                void video.play().catch(() => {
                  if (videoRef.current !== video) return;
                  if (!video.muted) {
                    video.muted = true;
                    setSoundEnabled(false);
                    setAudioError(true);
                    void video.play().catch(() => setPlaybackError(true));
                    return;
                  }
                  setPlaybackError(true);
                });
              }}
              onEnded={() => advancePlaylist()}
              onPlaying={() => setPlaybackError(false)}
              onError={() => {
                setPlaybackError(true);
                if (playlist.length > 1) advancePlaylist(2000);
              }}
            />
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Дууг хаах" : "Дууг асаах"}
              aria-pressed={soundEnabled}
              className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              {soundEnabled ? "Дууг хаах" : "Дууг асаах"}
            </button>
            {audioError && (
              <p role="alert" className="absolute inset-x-4 top-16 rounded-lg bg-black/75 px-3 py-2 text-center text-sm">
                Дууг тоглуулах боломжгүй байна. Дахин дарж оролдоно уу.
              </p>
            )}
            {playbackError && <p className="absolute inset-x-0 top-4 px-4 text-center text-sm">Бичлэгийг тоглуулах боломжгүй байна.</p>}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
            <p className="text-sm text-slate-200">{currentItem?.organizationName}</p>
            {currentItem?.title && <p className="text-lg font-semibold">{currentItem.title}</p>}
          </div>
        </main>

        <footer className="flex h-[12%] items-center justify-center border-t border-slate-800 bg-slate-950/90 px-5 text-center backdrop-blur-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{settings.contactText}</p>
            <p className="mt-1 text-xl font-semibold text-amber-300">{currentItem?.contactPhone || settings.contactPhone}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
