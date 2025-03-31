import { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/common/theme-provider";
import { StoreProvider } from "@/components/common/store-provider";
import { SettingsProvider } from "@/components/settings/settings-context";
import { SettingsDialogProvider } from "@/components/settings/settings-dialog-context";
import { FolderScanner } from "@/components/common/folder-scanner";
import "./globals.css";
import { cn } from "@/lib/utils/common";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Next DJ",
  description:
    "A music player designed for DJ'ing with uninterrupted playback. Featuring protections against accidental song changes by hiding the pause and skip buttons, it ensures a smooth and continuous music flow.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "bg-background font-sans antialiased overflow-hidden h-dvh",
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <SettingsProvider>
              <SettingsDialogProvider>
                <FolderScanner />
                {children}
                <Toaster />
              </SettingsDialogProvider>
            </SettingsProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
