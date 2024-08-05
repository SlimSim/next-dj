import "../styles/globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-100">
          <header className="bg-blue-600 text-white p-4">
            <h1 className="text-2xl">Next DJ</h1>
          </header>
          <main className="p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
