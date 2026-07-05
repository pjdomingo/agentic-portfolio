import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CertifyHub — AI Course Generator (Demo)",
  description:
    "Working demo: upload a document and watch Claude generate an interactive ISO/SOC compliance course.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
