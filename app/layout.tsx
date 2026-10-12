import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { AppShell } from "@/src/components/AppShell";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chomp Hunt",
  description: "Encontre o cantinho de cada Chomp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="pt-BR" className={`${fredoka.variable} h-full antialiased`}><body className="min-h-full"><AppShell>{children}</AppShell></body></html>;
}
