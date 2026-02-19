import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Studios - Wedding Portfolio Platform",
  description: "Premium wedding studio portfolio and CMS platform. Showcase your work beautifully.",
  keywords: ["wedding", "photography", "studio", "portfolio", "wedding photography"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
