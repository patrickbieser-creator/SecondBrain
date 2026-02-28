import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/nav/AppNav";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "FocusOS",
  description: "Capture, triage, score, and focus on what matters next.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <AppNav />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
