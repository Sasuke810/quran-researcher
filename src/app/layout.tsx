import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConversationProvider } from "@/contexts/ConversationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "الباحث في القرآن - Quran Research Assistant",
  description: "مساعد بحث قرآني ذكي يعتمد على نموذج EDLM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme-mode') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
                document.documentElement.setAttribute('data-theme', theme);
                if (!localStorage.getItem('theme-mode')) {
                  localStorage.setItem('theme-mode', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConversationProvider>{children}</ConversationProvider>
      </body>
    </html>
  );
}