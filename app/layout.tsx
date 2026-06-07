import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receipts — learn to judge media",
  description:
    "A tool that helps you learn how to judge photos, videos, and accounts. It teaches habits, not quick answers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
