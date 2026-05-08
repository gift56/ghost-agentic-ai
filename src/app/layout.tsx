import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Ghost AI",
    template: "%s",
  },
  description:
    "Ghost AI is a collaborative system architecture workspace for designing, sharing, and documenting technical systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              colorBackground: "var(--bg-surface)",
              colorInput: "var(--bg-subtle)",
              colorInputForeground: "var(--text-primary)",
              colorForeground: "var(--text-primary)",
              colorPrimary: "var(--accent-primary)",
              colorNeutral: "var(--text-secondary)",
              colorDanger: "var(--state-error)",
              colorSuccess: "var(--state-success)",
              colorBorder: "var(--border-default)",
              colorRing: "var(--accent-primary)",
              borderRadius: "var(--radius)",
              colorShimmer: "var(--bg-subtle)",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}