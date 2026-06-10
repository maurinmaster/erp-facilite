import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSession } from "@/actions/auth";
import Sidebar from "@/app/components/Sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP Facilite | Agência de Marketing",
  description: "Sistema ERP para gestão de produção em agência de marketing digital",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
      <body>
        {/* Layout Shell */}
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'row' }}>
          <Sidebar session={session} />
          
          <main style={{ flex: 1, padding: '32px', overflowY: 'auto', maxHeight: '100vh', background: 'var(--background)' }}>
            <div style={{ width: '100%' }}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
