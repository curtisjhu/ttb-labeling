import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TTB Labeling",
  description: "A tool for labeling alcohol labels using AI, built for the TTB. Supports single file uploads, batch jobs, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-black`}
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ flex: 1 }}>{children}</div>
        <footer className="w-full py-4 text-center text-xs text-zinc-500 bg-transparent border-t border-zinc-200 dark:border-zinc-800 mt-8">
          <nav className="flex flex-wrap justify-center gap-4">
            <a href="/" className="hover:underline">Auto Upload</a>
            <a href="/single" className="hover:underline">Single Upload</a>
            <a href="/multiple" className="hover:underline">Multiple Upload</a>
            {/* <a href="/batch" className="hover:underline">Batch Upload</a> */}
            <a href="/about" className="hover:underline">About</a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
