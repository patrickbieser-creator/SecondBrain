import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecondBrain",
  description: "Capture, triage, score, and focus on what matters next."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
