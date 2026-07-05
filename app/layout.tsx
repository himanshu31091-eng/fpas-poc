import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store";
import { AppProvider } from "@/components/prefs";
import { WeatherProvider } from "@/components/weather";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "First Point Animal Services — Job Manager (POC)",
  description:
    "AI-assisted intake, compliance readiness, and artifact drafting for FPAS Amsterdam imports. Proof of concept — mock data only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StoreProvider>
          <AppProvider>
            <WeatherProvider>
              <AppShell>{children}</AppShell>
            </WeatherProvider>
          </AppProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
