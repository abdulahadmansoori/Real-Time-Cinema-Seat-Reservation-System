import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Cinema Seat Reservation",
  description: "Real-time cinema seat reservation system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
