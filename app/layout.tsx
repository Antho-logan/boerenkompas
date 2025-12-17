import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoerenKompas | Van regels naar rust",
  description: "Helderheid in regelgeving voor de agrarische sector",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="scroll-smooth">
      <body
        className="antialiased bg-slate-50 text-slate-900 font-sans"
      >
        {children}
      </body>
    </html>
  );
}
