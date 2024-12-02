import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "dm-coffee",
  description: "Coffee counter",
  icons: {
    icon: [
      { rel: "icon", url: "/favicon-16x16.png", sizes: "16x16" },
      { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32" },
      { rel: "icon", url: "/favicon-48x48.png", sizes: "48x48" },
      { rel: "icon", url: "/favicon-64x64.png", sizes: "64x64" },
      { rel: "icon", url: "/favicon.ico" },
    ],
    apple: '/apple-touch-icon.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <html lang="en">
      <body className={inter.className+" lg:max-w-5xl xl:max-w-7xl"}>
        {children}
      </body>
  </html>
}
