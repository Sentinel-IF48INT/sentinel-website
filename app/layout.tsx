import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SENTINEL — Geopolitical Travel Safety & Threat Advisory Platform (WNI)",
  description:
    "Evaluate destination risk levels, active threat bulletins, and Indonesian diplomatic mission (KBRI) contacts for WNI travelers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${comfortaa.variable} h-full antialiased`}
    >
      <body
        className={`${comfortaa.className} min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
