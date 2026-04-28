import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AudioRoot } from "@/components/audio/AudioRoot";
import { getMusicTracks } from "@/lib/audio/music-list";

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
  const tracks = getMusicTracks();
  return (
    <html lang="en" className={`${bebas.variable} dark`}>
      <body>
        <AudioRoot tracks={tracks}>{children}</AudioRoot>
      </body>
    </html>
  );
}
