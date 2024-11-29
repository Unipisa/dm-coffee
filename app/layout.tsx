import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import package_json from '../package.json'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "dm-coffee",
  description: "Coffee counter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <html lang="en">
      <body className={inter.className}>
        <div>dm-coffee {package_json.version}</div>
        {children}
      </body>
  </html>
}
