import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AudioRoot } from "@/components/audio/AudioRoot";
import { getMusicTracks } from "@/lib/audio/music-list";
import { AuthControls } from "@/components/auth/AuthControls";
import { Analytics } from "@vercel/analytics/react";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const SITE_URL = "https://naruto-quiz.vercel.app";
const SITE_TITLE = "Naruto Quiz";
const SITE_DESCRIPTION =
  "Test your knowledge of Naruto and Naruto: Shippuden across six question types — multiple choice, drag-to-categorize, ordering, slider, and name autocomplete. Dattebayo!";

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
  // getMusicTracks() runs at build time (fs scan of public/music/), not per
  // request. AuthControls hydrates its own session client-side via Supabase,
  // so the layout has no dynamic dependencies and stays fully static.
  const tracks = getMusicTracks();
  return (
    <html lang="en" className={`${bebas.variable} dark`}>
      <body>
        <AudioRoot tracks={tracks}>
          <AuthControls />
          {children}
        </AudioRoot>
        <Analytics />
      </body>
    </html>
  );
}
