import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRVAAH X - Demand Forecast & Risk Intelligence",
  description: "Don't just predict the peak. Prepare for it. AI-powered grid predictive demand forecasting and risk engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-black text-gray-100">{children}</body>
    </html>
  );
}

