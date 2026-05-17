import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Header } from "@/app/components/Header";
import { ThemeProvider } from "@/app/components/theme-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LexGuard - Contract Risk Intelligence",
  description:
    "Upload a contract. Get a plain-English risk breakdown of every clause.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
