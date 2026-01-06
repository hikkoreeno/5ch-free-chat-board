import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Chat Board",
  description: "自由に語り合えるカフェ風掲示板",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
