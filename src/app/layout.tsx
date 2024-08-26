import "../styles/globals.css";
import { ReactNode } from "react";
import { Metadata } from "next";
import { MainStoreProvider } from "../context/MainStoreContext";
import { ServiceWorkerRegistration } from "../components/My_own_old_first_try/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Next DJ",
  description: "A music player PWA",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MainStoreProvider>
          <ServiceWorkerRegistration />
          <div className="min-h-screen bg-gray-100">
            <header className="bg-blue-600 text-white p-4">
              <h1 className="text-2xl">Next DJ</h1>
            </header>
            <main className="p-4">{children}</main>
          </div>
        </MainStoreProvider>
      </body>
    </html>
  );
}
