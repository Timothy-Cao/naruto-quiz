import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AudioRoot } from "@/components/audio/AudioRoot";
import { getMusicTracks } from "@/lib/audio/music-list";
import { AuthControls } from "@/components/auth/AuthControls";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Naruto Quiz",
  description: "Test your knowledge of Naruto and Naruto: Shippuden.",
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
      </body>
    </html>
  );
}
