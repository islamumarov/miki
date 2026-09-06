import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = { title: "Keep", description: "Notes and todo lists" };

// Apply saved/system theme before paint to avoid a light flash.
const themeInit = `(function(){try{var t=localStorage.theme;if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{themeInit}</Script>
      </head>
      <body className="min-h-screen bg-white text-gray-800 dark:bg-[#202124] dark:text-gray-200">{children}</body>
    </html>
  );
}
