import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AudioRoot } from "@/components/audio/AudioRoot";
import { getMusicTracks } from "@/lib/audio/music-list";
import { AuthControls } from "@/components/auth/AuthControls";
import { getCurrentAuthUser } from "@/lib/auth";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tracks = getMusicTracks();
  const user = await getCurrentAuthUser();
  return (
    <html lang="en" className={`${bebas.variable} dark`}>
      <body>
        <AudioRoot tracks={tracks}>
          <AuthControls initialUser={user} />
          {children}
        </AudioRoot>
      </body>
    </html>
  );
}
