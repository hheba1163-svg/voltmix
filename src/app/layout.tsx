import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voltmix | Digital Billboard",
  description: "Professional digital advertising platform for billboard playback and secure admin management.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
