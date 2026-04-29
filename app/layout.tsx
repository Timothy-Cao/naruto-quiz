import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AudioRoot } from "@/components/audio/AudioRoot";
import { getAllTracks } from "@/lib/audio/music-list";
import { AuthControls } from "@/components/auth/AuthControls";
import { Analytics } from "@vercel/analytics/react";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Static metadata stays generic so the architecture supports future packs
// (Avatar, JJK, etc.) without needing a redeploy or per-pack route. Visible
// branding comes from the active pack via <MainHeader>.
const SITE_URL = "https://naruto-quiz.vercel.app";
const SITE_TITLE = "Themed Quiz";
const SITE_DESCRIPTION =
  "Anime quiz packs with logical, deductive, and sensory questions. Currently shipping the Naruto OST pack — more to come.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0c0a09",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_TITLE,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // getAllTracks() runs at build time (fs scan of public/music/<pack>/) per
  // pack, not per request. AuthControls hydrates its own session client-side,
  // so the layout has no dynamic dependencies and stays fully static.
  const tracksByPack = getAllTracks();
  return (
    <html lang="en" className={`${bebas.variable} dark`}>
      <body>
        <AudioRoot tracksByPack={tracksByPack}>
          <AuthControls />
          {children}
        </AudioRoot>
        <Analytics />
      </body>
    </html>
  );
}
